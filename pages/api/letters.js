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
      } = req.query;

      let query;
      let values = [];

      if (type === "private") {
        if (!fromName || !toName || !fromBirthday || !toBirthday) {
          return res.status(200).json({ letters: [] });
        }

        query = `
          SELECT id, from_name, to_name, letter_content, letter_type, show_from_name, show_to_name, created_at
          FROM letters 
          WHERE letter_type = 'private' 
          AND from_name = ? 
          AND to_name = ? 
          AND from_birthday = ? 
          AND to_birthday = ?
          ORDER BY created_at DESC
        `;
        values = [fromName, toName, fromBirthday, toBirthday];
      } else if (type === "encrypted") {
        if (!fromName || !toName || !fromBirthday || !toBirthday) {
          return res.status(200).json({ letters: [] });
        }

        if (!securityAnswer) {
          // Return just the security question
          query = `
            SELECT id, security_question
            FROM letters 
            WHERE letter_type = 'encrypted' 
            AND from_name = ? 
            AND to_name = ? 
            AND from_birthday = ? 
            AND to_birthday = ?
            ORDER BY created_at DESC LIMIT 1
          `;
          values = [fromName, toName, fromBirthday, toBirthday];
        } else {
          // Verify answer and return letter if correct
          query = `
            SELECT id, from_name, to_name, letter_content, letter_type, show_from_name, show_to_name, created_at
            FROM letters 
            WHERE letter_type = 'encrypted' 
            AND from_name = ? 
            AND to_name = ? 
            AND from_birthday = ? 
            AND to_birthday = ?
            AND security_answer = ?
            ORDER BY created_at DESC
          `;
          values = [
            fromName,
            toName,
            fromBirthday,
            toBirthday,
            securityAnswer.toLowerCase().trim(),
          ];
        }
      } else {
        // Handle public and anonymous letters
        query = `
          SELECT id, from_name, to_name, letter_content, letter_type, show_from_name, show_to_name, created_at
          FROM letters 
          WHERE letter_type IN ('public', 'anonymous')
        `;

        if (search && search.trim()) {
          switch (searchType) {
            case "from":
              query += " AND from_name LIKE ?";
              values.push(`%${search}%`);
              break;
            case "to":
              query += " AND to_name LIKE ?";
              values.push(`%${search}%`);
              break;
            case "both":
            default:
              query += " AND (from_name LIKE ? OR to_name LIKE ?)";
              values.push(`%${search}%`, `%${search}%`);
              break;
          }
        }

        query += " ORDER BY created_at DESC LIMIT 50";
      }

      console.log("Executing query:", query, "with values:", values);
      const [rows] = await connection.execute(query, values);
      console.log(`Found ${rows.length} letters`);

      // Process letters for anonymous display
      const processedLetters = rows.map((letter) => ({
        ...letter,
        from_name: letter.show_from_name ? letter.from_name : "Anonymous",
        to_name: letter.show_to_name ? letter.to_name : "Anonymous",
      }));

      res.status(200).json({ letters: processedLetters });
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
