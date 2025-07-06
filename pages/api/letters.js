// pages/api/letters.js
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 60000,
  charset: "utf8mb4",
  multipleStatements: false,
  dateStrings: true,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (
    !process.env.DB_HOST ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_NAME
  ) {
    console.error("Database environment variables not set");
    return res.status(500).json({ error: "Database configuration missing" });
  }

  let connection;

  try {
    console.log("Attempting to connect to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("Database connected successfully");

    if (req.method === "POST") {
      const {
        fromName,
        toName,
        content,
        type,
        fromBirthday,
        toBirthday,
        showFromName,
        showToName,
        securityQuestion,
        securityAnswer,
      } = req.body;

      if (!fromName || !toName || !content || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let query = `
        INSERT INTO letters 
        (from_name, to_name, letter_content, letter_type, show_from_name, show_to_name, from_birthday, to_birthday, security_question, security_answer) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        fromName,
        toName,
        content,
        type,
        showFromName ? 1 : 0,
        showToName ? 1 : 0,
        type === "private" || type === "encrypted" ? fromBirthday : null,
        type === "private" || type === "encrypted" ? toBirthday : null,
        type === "encrypted" ? securityQuestion : null,
        type === "encrypted" ? securityAnswer?.toLowerCase().trim() : null,
      ];

      console.log("Inserting letter:", { fromName, toName, type });
      const [result] = await connection.execute(query, values);
      console.log("Letter inserted with ID:", result.insertId);

      res.status(201).json({
        message: "Letter created successfully",
        id: result.insertId,
      });
    } else if (req.method === "GET") {
      const {
        type,
        search,
        searchType,
        fromName,
        toName,
        fromBirthday,
        toBirthday,
        securityAnswer,
        letterId,
        page = 1,
        limit = 10,
        action = "list", // 'list' or 'select'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let query;
      let countQuery;
      let values = [];
      let countValues = [];

      if (type === "private") {
        if (!fromName || !toName || !fromBirthday || !toBirthday) {
          return res
            .status(200)
            .json({ letters: [], total: 0, hasMore: false });
        }

        if (action === "list") {
          // First, get count of matching letters
          countQuery = `
            SELECT COUNT(*) as total
            FROM letters 
            WHERE letter_type = 'private' 
            AND from_name = ? 
            AND to_name = ? 
            AND from_birthday = ? 
            AND to_birthday = ?
          `;
          countValues = [fromName, toName, fromBirthday, toBirthday];

          // Get the list with preview (first 100 chars of content)
          query = `
            SELECT id, from_name, to_name, 
                   SUBSTRING(letter_content, 1, 100) as content_preview,
                   CASE 
                     WHEN LENGTH(letter_content) > 100 THEN CONCAT(SUBSTRING(letter_content, 1, 100), '...')
                     ELSE letter_content
                   END as letter_preview,
                   created_at
            FROM letters 
            WHERE letter_type = 'private' 
            AND from_name = ? 
            AND to_name = ? 
            AND from_birthday = ? 
            AND to_birthday = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
          `;
          values = [
            fromName,
            toName,
            fromBirthday,
            toBirthday,
            parseInt(limit),
            offset,
          ];
        } else if (action === "select" && letterId) {
          // Get specific letter by ID
          query = `
            SELECT id, from_name, to_name, letter_content, letter_type, 
                   show_from_name, show_to_name, created_at
            FROM letters 
            WHERE id = ? 
            AND letter_type = 'private' 
            AND from_name = ? 
            AND to_name = ? 
            AND from_birthday = ? 
            AND to_birthday = ?
          `;
          values = [letterId, fromName, toName, fromBirthday, toBirthday];
        }
      } else if (type === "encrypted") {
        if (!fromName || !toName || !fromBirthday || !toBirthday) {
          return res
            .status(200)
            .json({ letters: [], total: 0, hasMore: false });
        }

        if (!securityAnswer && !letterId) {
          if (action === "list") {
            // Get count of matching encrypted letters
            countQuery = `
              SELECT COUNT(*) as total
              FROM letters 
              WHERE letter_type = 'encrypted' 
              AND from_name = ? 
              AND to_name = ? 
              AND from_birthday = ? 
              AND to_birthday = ?
            `;
            countValues = [fromName, toName, fromBirthday, toBirthday];

            // Return list of encrypted letters with security questions
            query = `
              SELECT id, security_question, created_at,
                     SUBSTRING(letter_content, 1, 50) as content_hint
              FROM letters 
              WHERE letter_type = 'encrypted' 
              AND from_name = ? 
              AND to_name = ? 
              AND from_birthday = ? 
              AND to_birthday = ?
              ORDER BY created_at DESC
              LIMIT ? OFFSET ?
            `;
            values = [
              fromName,
              toName,
              fromBirthday,
              toBirthday,
              parseInt(limit),
              offset,
            ];
          }
        } else if (letterId && securityAnswer) {
          // Verify answer for specific letter and return full content
          query = `
            SELECT id, from_name, to_name, letter_content, letter_type, 
                   show_from_name, show_to_name, created_at
            FROM letters 
            WHERE id = ? 
            AND letter_type = 'encrypted' 
            AND from_name = ? 
            AND to_name = ? 
            AND from_birthday = ? 
            AND to_birthday = ?
            AND security_answer = ?
          `;
          values = [
            letterId,
            fromName,
            toName,
            fromBirthday,
            toBirthday,
            securityAnswer.toLowerCase().trim(),
          ];
        }
      } else {
        // Handle public and anonymous letters with pagination
        countQuery = `
          SELECT COUNT(*) as total
          FROM letters 
          WHERE letter_type IN ('public', 'anonymous')
        `;

        query = `
          SELECT id, from_name, to_name, letter_content, letter_type, 
                 show_from_name, show_to_name, created_at
          FROM letters 
          WHERE letter_type IN ('public', 'anonymous')
        `;

        if (search && search.trim()) {
          const searchCondition = (() => {
            switch (searchType) {
              case "from":
                return " AND from_name LIKE ?";
              case "to":
                return " AND to_name LIKE ?";
              case "both":
              default:
                return " AND (from_name LIKE ? OR to_name LIKE ?)";
            }
          })();

          countQuery += searchCondition;
          query += searchCondition;

          if (searchType === "both") {
            countValues.push(`%${search}%`, `%${search}%`);
            values.push(`%${search}%`, `%${search}%`);
          } else {
            countValues.push(`%${search}%`);
            values.push(`%${search}%`);
          }
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        values.push(parseInt(limit), offset);
      }

      // Execute count query if needed
      let total = 0;
      if (countQuery) {
        const [countResult] = await connection.execute(countQuery, countValues);
        total = countResult[0].total;
      }

      console.log("Executing query:", query, "with values:", values);
      const [rows] = await connection.execute(query, values);
      console.log(`Found ${rows.length} letters`);

      // Process letters for anonymous display (except for encrypted previews)
      const processedLetters = rows.map((letter) => {
        if (type === "encrypted" && !letter.letter_content) {
          // For encrypted letter previews, don't modify names
          return letter;
        }

        return {
          ...letter,
          from_name:
            letter.show_from_name !== undefined
              ? letter.show_from_name
                ? letter.from_name
                : "Anonymous"
              : letter.from_name,
          to_name:
            letter.show_to_name !== undefined
              ? letter.show_to_name
                ? letter.to_name
                : "Anonymous"
              : letter.to_name,
        };
      });

      const hasMore = total > parseInt(page) * parseInt(limit);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        letters: processedLetters,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          hasMore,
          limit: parseInt(limit),
        },
      });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log("Database connection closed");
      } catch (error) {
        console.error("Error closing connection:", error);
      }
    }
  }
}
