// pages/index.js
import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import Head from "next/head";

import {
  FiEdit3,
  FiBook,
  FiLock,
  FiShield,
  FiGithub,
  FiSend,
  FiSearch,
  FiEye,
  FiKey,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
  FiList,
  FiUnlock,
} from "react-icons/fi";

export default function Graveletters() {
  const [activeTab, setActiveTab] = useState("read");
  const [letters, setLetters] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("both");
  const [loading, setLoading] = useState(false);

  // Refs for DOM elements
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);

  // Pagination states
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    total: 0,
    hasMore: false,
    limit: 10,
  });

  // Letter selection states
  const [privateLettersList, setPrivateLettersList] = useState([]);
  const [encryptedLettersList, setEncryptedLettersList] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showLetterSelection, setShowLetterSelection] = useState(false);

  // Form states
  const [letterForm, setLetterForm] = useState({
    fromName: "",
    toName: "",
    content: "",
    type: "public",
    fromBirthday: "",
    toBirthday: "",
    showFromName: true,
    showToName: true,
    securityQuestion: "",
    securityAnswer: "",
  });

  // Private letter viewing
  const [privateForm, setPrivateForm] = useState({
    fromName: "",
    toName: "",
    fromBirthday: "",
    toBirthday: "",
  });

  // Encrypted letter viewing
  const [encryptedForm, setEncryptedForm] = useState({
    fromName: "",
    toName: "",
    fromBirthday: "",
    toBirthday: "",
    securityAnswer: "",
    securityQuestion: "",
  });

  const [showSecurityQuestion, setShowSecurityQuestion] = useState(false);

  // Load letters on component mount
  useEffect(() => {
    if (activeTab === "read") {
      loadLetters(1);
    }
  }, [activeTab]);

  const loadLetters = async (page = 1, searchParams = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...searchParams,
      });

      const response = await fetch(`/api/letters?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Loaded letters:", data);

      setLetters(data.letters || []);
      setSearchResults(data.letters || []);
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 0,
          total: 0,
          hasMore: false,
          limit: 10,
        }
      );
    } catch (error) {
      console.error("Error loading letters:", error);
      const fallbackLetters = [
        {
          id: 1,
          from_name: "System",
          to_name: "Users",
          letter_content:
            "Welcome to Graveletters! This is a sample letter. Database connection is being established.",
          letter_type: "public",
          created_at: new Date().toISOString(),
        },
      ];
      setLetters(fallbackLetters);
      setSearchResults(fallbackLetters);
    }
  };

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    const searchParams = {};
    if (searchTerm) {
      searchParams.search = searchTerm;
      searchParams.searchType = searchType;
    }

    loadLetters(newPage, searchParams);
  }, [pagination.totalPages, searchTerm, searchType]);

  const handleSubmitLetter = useCallback(async () => {
    if (!letterForm.fromName || !letterForm.toName || !letterForm.content) {
      alert("Please fill in all required fields");
      return;
    }

    if (
      (letterForm.type === "private" || letterForm.type === "encrypted") &&
      (!letterForm.fromBirthday || !letterForm.toBirthday)
    ) {
      alert("Please enter both birthdays for private/encrypted letters");
      return;
    }

    if (
      letterForm.type === "encrypted" &&
      (!letterForm.securityQuestion || !letterForm.securityAnswer)
    ) {
      alert(
        "Please enter both security question and answer for encrypted letters"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(letterForm),
      });

      if (response.ok) {
        alert("Letter sent successfully!");

        setLetterForm({
          fromName: "",
          toName: "",
          content: "",
          type: "public",
          fromBirthday: "",
          toBirthday: "",
          showFromName: true,
          showToName: true,
          securityQuestion: "",
          securityAnswer: "",
        });

        if (letterForm.type !== "private" && letterForm.type !== "encrypted") {
          loadLetters(1);
        }
      } else {
        throw new Error("Failed to send letter");
      }
    } catch (error) {
      console.error("Error sending letter:", error);
      alert("Error sending letter. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [letterForm]);

  const handleSearch = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        searchType: searchType,
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();
      setSearchResults(data.letters || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error searching letters:", error);
    }
  }, [searchTerm, searchType, pagination.limit]);

  const handlePrivateLetterSearch = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        type: "private",
        fromName: privateForm.fromName,
        toName: privateForm.toName,
        fromBirthday: privateForm.fromBirthday,
        toBirthday: privateForm.toBirthday,
        action: "list",
        page: "1",
        limit: "50",
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();

      if (data.letters && data.letters.length > 0) {
        if (data.letters.length === 1) {
          // If only one letter, show it directly
          setSelectedLetter(data.letters[0]);
          setShowLetterSelection(false);
          await handlePrivateLetterView(data.letters[0].id);
        } else {
          // Multiple letters found, show selection
          setPrivateLettersList(data.letters);
          setShowLetterSelection(true);
          setSearchResults([]);
        }
      } else {
        setPrivateLettersList([]);
        setShowLetterSelection(false);
        setSearchResults([]);
        alert("No letter found with those details.");
      }
    } catch (error) {
      console.error("Error finding private letters:", error);
      alert("Error searching for private letters.");
    }
  }, [privateForm]);

  const handlePrivateLetterView = useCallback(async (letterId) => {
    try {
      const params = new URLSearchParams({
        type: "private",
        fromName: privateForm.fromName,
        toName: privateForm.toName,
        fromBirthday: privateForm.fromBirthday,
        toBirthday: privateForm.toBirthday,
        action: "select",
        letterId: letterId.toString(),
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();

      if (data.letters && data.letters.length > 0) {
        setSearchResults(data.letters);
        setShowLetterSelection(false);
        alert("Private letter loaded!");
      } else {
        alert("Error loading the selected letter.");
      }
    } catch (error) {
      console.error("Error loading private letter:", error);
      alert("Error loading private letter.");
    }
  }, [privateForm]);

  const handleEncryptedLetterStep1 = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        type: "encrypted",
        fromName: encryptedForm.fromName,
        toName: encryptedForm.toName,
        fromBirthday: encryptedForm.fromBirthday,
        toBirthday: encryptedForm.toBirthday,
        action: "list",
        page: "1",
        limit: "50",
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();

      if (data.letters && data.letters.length > 0) {
        setEncryptedLettersList(data.letters);
        setShowSecurityQuestion(true);
        setSearchResults([]);
      } else {
        alert("No encrypted letters found with those details.");
        setShowSecurityQuestion(false);
        setEncryptedLettersList([]);
      }
    } catch (error) {
      console.error("Error finding encrypted letters:", error);
      alert("Error searching for encrypted letters.");
    }
  }, [encryptedForm]);

  const handleEncryptedLetterStep2 = useCallback(async (letterId, securityAnswer) => {
    try {
      const params = new URLSearchParams({
        type: "encrypted",
        fromName: encryptedForm.fromName,
        toName: encryptedForm.toName,
        fromBirthday: encryptedForm.fromBirthday,
        toBirthday: encryptedForm.toBirthday,
        letterId: letterId.toString(),
        securityAnswer: securityAnswer,
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();

      if (data.letters && data.letters.length > 0) {
        setSearchResults(data.letters);
        setShowSecurityQuestion(false);
        setEncryptedLettersList([]);
        alert("Encrypted letter unlocked!");
      } else {
        alert("Incorrect answer. Please try again.");
      }
    } catch (error) {
      console.error("Error unlocking encrypted letter:", error);
      alert("Error unlocking encrypted letter.");
    }
  }, [encryptedForm]);

  // Memoized tab click handler
  const handleTabClick = useCallback((tabKey) => {
    if (tabKey === "host") {
      window.open(
        "https://github.com/BlesslinJerishR/OpenSource-GraveLetters",
        "_blank"
      );
    } else {
      setActiveTab(tabKey);
    }
  }, []);

  // Memoized form handlers
  const handleLetterFormChange = useCallback((field, value) => {
    setLetterForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePrivateFormChange = useCallback((field, value) => {
    setPrivateForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEncryptedFormChange = useCallback((field, value) => {
    setEncryptedForm(prev => ({ ...prev, [field]: value }));
  }, []);



  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const PaginationControls = memo(({ onPageChange, pagination }) => {
    if (pagination.totalPages <= 1) return null;

    const { currentPage, totalPages } = pagination;

    const pages = useMemo(() => {
      const result = [];
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      for (let i = startPage; i <= endPage; i++) {
        result.push(i);
      }
      return result;
    }, [currentPage, totalPages]);

    const handlePrevious = useCallback(() => {
      onPageChange(currentPage - 1);
    }, [onPageChange, currentPage]);

    const handleNext = useCallback(() => {
      onPageChange(currentPage + 1);
    }, [onPageChange, currentPage]);

    const handlePageClick = useCallback((page) => {
      onPageChange(page);
    }, [onPageChange]);

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    return (
      <div style={styles.paginationContainer}>
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          style={{
            ...styles.paginationButton,
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          <FiChevronLeft size={16} />
          Previous
        </button>

        <div style={styles.pageNumbers}>
          {startPage > 1 && (
            <>
              <button onClick={() => handlePageClick(1)} style={styles.pageButton}>
                1
              </button>
              {startPage > 2 && <span style={styles.ellipsis}>...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              style={{
                ...styles.pageButton,
                ...(page === currentPage ? styles.pageButtonActive : {}),
              }}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span style={styles.ellipsis}>...</span>
              )}
              <button
                onClick={() => handlePageClick(totalPages)}
                style={styles.pageButton}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          style={{
            ...styles.paginationButton,
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          Next
          <FiChevronRight size={16} />
        </button>
      </div>
    );
  });

  const LetterSelectionList = memo(({ letters, type, onSelect, onUnlock }) => {
    const [securityAnswers, setSecurityAnswers] = useState({});

    const handleSecurityAnswerChange = useCallback((letterId, value) => {
      setSecurityAnswers((prev) => ({
        ...prev,
        [letterId]: value,
      }));
    }, []);

    const handleUnlock = useCallback((letterId) => {
      const answer = securityAnswers[letterId] || "";
      if (answer.trim()) {
        onUnlock(letterId, answer.trim());
      } else {
        alert("Please enter an answer before unlocking.");
      }
    }, [securityAnswers, onUnlock]);

    return (
      <div style={styles.letterSelectionContainer}>
        <h3 style={styles.selectionTitle}>
          {type === "private"
            ? "Select Private Letter"
            : "Select Encrypted Letter to Unlock"}
        </h3>
        <p style={styles.selectionSubtitle}>
          Multiple letters found. Choose one to{" "}
          {type === "private" ? "view" : "unlock"}:
        </p>

        {letters.map((letter, index) => (
          <div key={letter.id} style={styles.letterSelectionCard}>
            <div style={styles.letterSelectionHeader}>
              <span style={styles.letterNumber}>Letter #{index + 1}</span>
              <span style={styles.letterDate}>
                Sent: {formatDate(letter.created_at)}
              </span>
            </div>

            {type === "private" && (
              <div style={styles.letterPreview}>
                <strong>Preview:</strong> {letter.letter_preview}
              </div>
            )}

            {type === "encrypted" && (
              <div style={styles.encryptedLetterInfo}>
                <div style={styles.securityQuestion}>
                  <strong>Security Question:</strong> {letter.security_question}
                </div>
                <div style={styles.contentHint}>
                  <strong>Content hint:</strong> {letter.content_hint}...
                </div>
                <div style={styles.unlockSection}>
                  <input
                    type="text"
                    placeholder="Enter your answer (lowercase)"
                    value={securityAnswers[letter.id] || ""}
                    onChange={(e) =>
                      handleSecurityAnswerChange(letter.id, e.target.value)
                    }
                    style={styles.securityAnswerInput}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleUnlock(letter.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleUnlock(letter.id)}
                    style={styles.unlockButton}
                  >
                    <FiUnlock size={16} />
                    Unlock
                  </button>
                </div>
              </div>
            )}

            {type === "private" && (
              <button
                onClick={() => onSelect(letter.id)}
                style={styles.selectButton}
              >
                <FiEye size={16} />
                View This Letter
              </button>
            )}
          </div>
        ))}
      </div>
    );
  });



  const styles = useMemo(() => ({
    container: {
      minHeight: "100vh",
      background:
        "linear-gradient(135deg, #f8f8f8 0%, #ffffff 50%, #f0f0f0 100%)",
      color: "#000000",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      borderBottom: "3px solid #000000",
      padding: "20px",
      textAlign: "center",
      background: "linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)",
      boxShadow: "0 4px 0 #000000",
    },
    title: {
      fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
      fontWeight: "bold",
      margin: "0",
      letterSpacing: "2px",
      textShadow: "2px 2px 0 #cccccc",
      fontFamily: "Libertinus Mono",
      fontWeight: 400,
      fontStyle: "normal",
      display: "flex",
      textAlign: "center",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    titleTam: {
      fontSize: "clamp(1.2rem, 2vw, 0.8rem)",
      fontWeight: "bold",
      margin: "0",
      letterSpacing: "2px",
      textShadow: "2px 2px 0 #cccccc",
      fontFamily: "Libertinus Mono",
      fontWeight: 400,
      fontStyle: "normal",
      display: "flex",
      textAlign: "center",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      paddingBottom: 30,
    },
    subtitle: {
      margin: "10px 0 0 0",
      fontSize: "clamp(0.9rem, 2vw, 1rem)",
      fontStyle: "italic",
    },
    nav: {
      borderBottom: "3px solid #000000",
      borderLeft: "3px solid #000000",
      padding: "0",
      display: "flex",
      flexWrap: "wrap",
      background: "linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)",
      boxShadow: "0 3px 0 #000000",
    },
    navButton: {
      padding: "15px 20px",
      border: "none",
      cursor: "pointer",
      textTransform: "uppercase",
      fontWeight: "bold",
      borderRight: "2px solid #000000",
      fontSize: "clamp(0.8rem, 1.5vw, 1rem)",
      flex: "1",
      minWidth: "120px",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      fontFamily: "Libertinus Mono",
      fontWeight: 400,
      fontStyle: "normal",
    },
    main: {
      padding: "20px",
      maxWidth: "900px",
      margin: "0 auto",
    },
    formContainer: {
      border: "3px solid #000000",
      padding: "30px",
      background:
        "linear-gradient(145deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)",
      margin: "20px 0",
      boxShadow: "8px 8px 0 #000000",
      position: "relative",
    },
    inputGroup: {
      marginBottom: "20px",
    },
    birthdayRow: {
      display: "flex",
      gap: "15px",
      marginBottom: "20px",
      flexWrap: "wrap",
    },
    birthdayInputGroup: {
      flex: "1",
      minWidth: "250px",
    },
    birthdayRow: {
      display: "flex",
      gap: "15px",
      marginBottom: "20px",
      flexWrap: "wrap",
    },
    birthdayInputGroup: {
      flex: "1",
      minWidth: "250px",
    },
    datePickerWrapper: {
      position: "relative",
      width: "100%",
    },
    label: {
      display: "block",
      marginBottom: "10px",
      fontWeight: "bold",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      textShadow: "1px 1px 0 #f0f0f0",
    },
    input: {
      width: "100%",
      padding: "12px",
      border: "2px solid #000000",
      backgroundColor: "#ffffff",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      boxSizing: "border-box",
      boxShadow: "3px 3px 0 #000000",
      transition: "all 0.2s ease",
    },
    senderBirthdayInput: {
      width: "100%",
      padding: "12px",
      border: "2px solid #000000",
      backgroundColor: "#ffffff",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      boxSizing: "border-box",
      boxShadow: "3px 3px 0 #000000",
      transition: "all 0.2s ease",
      transform: "scaleX(1.7)",
      transformOrigin: "left center"
    },
    recipientBirthdayInput: {
      width: "100%",
      padding: "12px",
      border: "2px solid #000000",
      backgroundColor: "#ffffff",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      boxSizing: "border-box",
      boxShadow: "3px 3px 0 #000000",
      transition: "all 0.2s ease",
      transform: "translateX(-50%) scaleX(2.0)",
      transformOrigin: "left center"
    },
    inputFocus: {
      transform: "translate(-1px, -1px)",
      boxShadow: "4px 4px 0 #000000",
    },
    select: {
      width: "100%",
      padding: "12px",
      border: "2px solid #000000",
      backgroundColor: "#ffffff",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      boxSizing: "border-box",
      boxShadow: "3px 3px 0 #000000",
      transition: "all 0.2s ease",
    },
    textarea: {
      width: "100%",
      padding: "15px",
      border: "3px solid #000000",
      background: "linear-gradient(145deg, #ffffff 0%, #fefefe 100%)",
      fontFamily: "serif",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      lineHeight: "1.6",
      boxSizing: "border-box",
      resize: "vertical",
      boxShadow: "4px 4px 0 #000000",
      backgroundImage: `
        linear-gradient(90deg, transparent 79px, #d0d0d0 79px, #d0d0d0 82px, transparent 82px),
        linear-gradient(#f0f0f0 0.1em, transparent 0.1em)
      `,
      backgroundSize: "100% 1.5em",
      transition: "all 0.2s ease",
    },
    button: {
      width: "100%",
      padding: "15px",
      backgroundColor: "#000000",
      color: "#ffffff",
      border: "3px solid #000000",
      cursor: "pointer",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      fontWeight: "bold",
      textTransform: "uppercase",
      boxShadow: "4px 4px 0 #333333",
      transition: "all 0.2s ease",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    buttonHover: {
      transform: "translate(-2px, -2px)",
      boxShadow: "6px 6px 0 #333333",
    },
    searchContainer: {
      border: "3px solid #000000",
      padding: "20px",
      marginBottom: "30px",
      background: "linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)",
      boxShadow: "6px 6px 0 #000000",
    },
    searchRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      alignItems: "center",
    },
    letterCard: {
      border: "3px solid #000000",
      padding: "30px",
      marginBottom: "30px",
      background:
        "linear-gradient(145deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)",
      boxShadow: "8px 8px 0 #000000",
      position: "relative",
      backgroundImage: `
        linear-gradient(90deg, transparent 79px, #d8d8d8 79px, #d8d8d8 82px, transparent 82px),
        linear-gradient(#f2f2f2 0.1em, transparent 0.1em)
      `,
      backgroundSize: "100% 1.8em",
    },
    letterCardPaper: {
      "::before": {
        content: '""',
        position: "absolute",
        top: "-3px",
        left: "-3px",
        right: "-3px",
        bottom: "-3px",
        background: "linear-gradient(45deg, #f0f0f0, #ffffff)",
        zIndex: -1,
      },
    },
    letterHeader: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "20px",
      fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)",
      flexWrap: "wrap",
      gap: "10px",
      fontWeight: "bold",
      textShadow: "1px 1px 0 #f0f0f0",
    },
    letterContent: {
      fontFamily: "serif",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      lineHeight: "1.8",
      marginBottom: "20px",
      whiteSpace: "pre-wrap",
      textShadow: "0.5px 0.5px 0 #f8f8f8",
    },
    letterFooter: {
      textAlign: "right",
      fontSize: "clamp(0.7rem, 1vw, 0.8rem)",
      fontStyle: "italic",
      borderTop: "2px solid #000000",
      paddingTop: "10px",
      marginTop: "10px",
    },
    gifContainer: {
      border: "3px solid #000000",
      padding: "30px",
      margin: "30px 0",
      background:
        "linear-gradient(145deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)",
      boxShadow: "8px 8px 0 #000000",
      textAlign: "center",
      maxWidth: "900px",
      marginLeft: "auto",
      marginRight: "auto",
    },
    gif: {
      width: "100%",
      maxWidth: "600px",
      height: "auto",
      border: "3px solid #000000",
      boxShadow: "5px 5px 0 #000000",
      borderRadius: "8px",
    },
    footer: {
      borderTop: "3px solid #000000",
      padding: "20px",
      textAlign: "center",
      marginTop: "50px",
      background: "linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%)",
      boxShadow: "0 -3px 0 #000000",
    },
    checkbox: {
      display: "flex",
      alignItems: "center",
      marginTop: "5px",
      fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)",
    },
    securityQuestionBox: {
      padding: "15px",
      background: "linear-gradient(145deg, #f8f8f8 0%, #ffffff 100%)",
      border: "3px solid #000000",
      boxShadow: "5px 5px 0 #000000",
      position: "relative",
    },
    paperTexture: {
      backgroundImage: `
        radial-gradient(circle at 1px 1px, rgba(0,0,0,.15) 1px, transparent 0),
        linear-gradient(45deg, transparent 40%, rgba(0,0,0,.05) 50%, transparent 60%)
      `,
      backgroundSize: "20px 20px, 40px 40px",
    },
    // Pagination styles
    paginationContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      margin: "30px 0",
      flexWrap: "wrap",
    },
    paginationButton: {
      padding: "10px 15px",
      backgroundColor: "#000000",
      color: "#ffffff",
      border: "2px solid #000000",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: "bold",
      textTransform: "uppercase",
      boxShadow: "3px 3px 0 #333333",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },
    pageNumbers: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },
    pageButton: {
      padding: "8px 12px",
      backgroundColor: "#ffffff",
      color: "#000000",
      border: "2px solid #000000",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: "bold",
      boxShadow: "2px 2px 0 #000000",
      transition: "all 0.2s ease",
      minWidth: "40px",
    },
    pageButtonActive: {
      backgroundColor: "#000000",
      color: "#ffffff",
      boxShadow: "2px 2px 0 #333333",
    },
    ellipsis: {
      padding: "0 5px",
      fontSize: "1.2rem",
      fontWeight: "bold",
    },
    // Letter selection styles
    letterSelectionContainer: {
      border: "3px solid #000000",
      padding: "30px",
      background:
        "linear-gradient(145deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)",
      margin: "20px 0",
      boxShadow: "8px 8px 0 #000000",
    },
    selectionTitle: {
      fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
      fontFamily: "Libertinus Mono",
      fontWeight: 400,
      marginBottom: "10px",
      textAlign: "center",
    },
    selectionSubtitle: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      fontStyle: "italic",
      marginBottom: "20px",
      textAlign: "center",
      color: "#666",
    },
    letterSelectionCard: {
      border: "2px solid #000000",
      padding: "20px",
      marginBottom: "15px",
      background: "linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%)",
      boxShadow: "4px 4px 0 #000000",
    },
    letterSelectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)",
      fontWeight: "bold",
    },
    letterNumber: {
      color: "#000000",
      fontSize: "1rem",
    },
    letterDate: {
      color: "#666",
      fontSize: "0.9rem",
    },
    letterPreview: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      lineHeight: "1.6",
      marginBottom: "15px",
      fontFamily: "serif",
      color: "#333",
    },
    encryptedLetterInfo: {
      marginBottom: "15px",
    },
    securityQuestion: {
      marginBottom: "10px",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      padding: "10px",
      background: "linear-gradient(145deg, #f0f0f0 0%, #ffffff 100%)",
      border: "2px solid #ccc",
      borderRadius: "5px",
    },
    contentHint: {
      marginBottom: "15px",
      fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)",
      color: "#666",
      fontStyle: "italic",
    },
    unlockSection: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    securityAnswerInput: {
      flex: "1",
      padding: "8px 12px",
      border: "2px solid #000000",
      backgroundColor: "#ffffff",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      boxSizing: "border-box",
      boxShadow: "2px 2px 0 #000000",
      minWidth: "200px",
    },
    unlockButton: {
      padding: "8px 15px",
      backgroundColor: "#000000",
      color: "#ffffff",
      border: "2px solid #000000",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: "bold",
      textTransform: "uppercase",
      boxShadow: "3px 3px 0 #333333",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      whiteSpace: "nowrap",
    },
    selectButton: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#000000",
      color: "#ffffff",
      border: "2px solid #000000",
      cursor: "pointer",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      fontWeight: "bold",
      textTransform: "uppercase",
      boxShadow: "3px 3px 0 #333333",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
  }), []);

  return (
    <>
      <Head>
        <title>Graveletters - Send letters that last forever | blessl.in</title>
        <meta
          name="description"
          content="Graveletters by blessl.in - Send anonymous, public, private, or encrypted letters that last forever. Share your thoughts, memories, and messages with the world or keep them private. Free letter writing platform hosted at graveletters.blessl.in"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* SEO Keywords */}
        <meta
          name="keywords"
          content="graveletters, blessl.in, letters, anonymous letters, private letters, encrypted letters, message platform, letter writing, digital letters, forever letters, grave letters"
        />
        <meta name="author" content="blessl.in" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://graveletters.blessl.in/" />
        <meta
          property="og:title"
          content="Graveletters - Send letters that last forever | blessl.in"
        />
        <meta
          property="og:description"
          content="Send anonymous, public, private, or encrypted letters that last forever. A unique letter writing platform by blessl.in"
        />
        <meta
          property="og:image"
          content="https://img.icons8.com/3d-fluency/100/grave.png"
        />
        <meta property="og:site_name" content="Graveletters by blessl.in" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://graveletters.blessl.in/"
        />
        <meta
          property="twitter:title"
          content="Graveletters - Send letters that last forever | blessl.in"
        />
        <meta
          property="twitter:description"
          content="Send anonymous, public, private, or encrypted letters that last forever. A unique letter writing platform by blessl.in"
        />
        <meta
          property="twitter:image"
          content="https://img.icons8.com/3d-fluency/100/grave.png"
        />

        {/* Additional SEO */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <link rel="canonical" href="https://graveletters.blessl.in/" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Graveletters",
            description:
              "Send anonymous, public, private, or encrypted letters that last forever",
            url: "https://graveletters.blessl.in/",
            applicationCategory: "CommunicationApplication",
            operatingSystem: "Web Browser",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            creator: {
              "@type": "Organization",
              name: "blessl.in",
              url: "https://blessl.in",
            },
          })}
        </script>

        <link
          rel="icon"
          href="https://img.icons8.com/3d-fluency/100/grave.png"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Libertinus+Mono&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>
            <img
              width="100"
              height="100"
              src="https://img.icons8.com/3d-fluency/100/grave.png"
              alt="grave"
            />
            GRAVELETTERS
          </h1>
          <p style={styles.subtitle}>Send letters that last forever.</p>
        </header>

        <nav style={styles.nav}>
          {useMemo(
            () => [
              { key: "read", label: "Read Letters", icon: FiBook },
              { key: "write", label: "Write Letter.", icon: FiEdit3 },
              { key: "private", label: "Private Letters", icon: FiLock },
              { key: "encrypted", label: "Encrypted Letters", icon: FiShield },
              { key: "host", label: "Self Host > Open Source", icon: FiGithub },
            ],
            []
          ).map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                style={{
                  ...styles.navButton,
                  backgroundColor:
                    tab.key === "host"
                      ? "#00FF7F"
                      : activeTab === tab.key
                      ? "#000000"
                      : "#ffffff",
                  color:
                    tab.key === "host"
                      ? "#000000"
                      : activeTab === tab.key
                      ? "#ffffff"
                      : "#000000",
                  boxShadow: tab.key === "host" ? "0 3px 0 #00FF7F" : undefined,
                }}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <main style={styles.main}>
          {/* Write Letter Tab */}
          {activeTab === "write" && (
            <div>
              <h2
                style={{
                  marginBottom: "30px",
                  textAlign: "center",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontFamily: "Libertinus Mono",
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                Write a Letter.
              </h2>
              <p style={styles.titleTam} s>
                கடிதமெழுத கற்றுக்கொள் வித,விதமாய் பொய் சொல்.
              </p>
              <p style={styles.titleTam} s>
                Imagine sending messages to your ex - even after she blocks you
                everywhere, even in Google Pay.
              </p>
              <div style={styles.formContainer}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Letter Type:</label>
                  <select
                    value={letterForm.type}
                    onChange={(e) =>
                      setLetterForm({ ...letterForm, type: e.target.value })
                    }
                    style={styles.select}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="anonymous">Anonymous</option>
                    <option value="encrypted">Encrypted</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>From:</label>
                  <input
                    type="text"
                    value={letterForm.fromName}
                    onChange={(e) =>
                      setLetterForm({ ...letterForm, fromName: e.target.value })
                    }
                    style={styles.input}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                    required
                  />
                  {letterForm.type === "anonymous" && (
                    <label style={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={letterForm.showFromName}
                        onChange={(e) =>
                          setLetterForm({
                            ...letterForm,
                            showFromName: e.target.checked,
                          })
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Show sender name
                    </label>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>To:</label>
                  <input
                    type="text"
                    value={letterForm.toName}
                    onChange={(e) =>
                      setLetterForm({ ...letterForm, toName: e.target.value })
                    }
                    style={styles.input}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                    required
                  />
                  {letterForm.type === "anonymous" && (
                    <label style={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={letterForm.showToName}
                        onChange={(e) =>
                          setLetterForm({
                            ...letterForm,
                            showToName: e.target.checked,
                          })
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Show recipient name
                    </label>
                  )}
                </div>

                {(letterForm.type === "private" ||
                  letterForm.type === "encrypted") && (
                  <div style={styles.birthdayRow}>
                    <div style={styles.birthdayInputGroup}>
                      <label style={styles.label}>Sender's Birthday:</label>
                      <input
                        type="date"
                        value={letterForm.fromBirthday}
                        onChange={(e) =>
                          setLetterForm({
                            ...letterForm,
                            fromBirthday: e.target.value,
                          })
                        }
                        style={styles.input}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translate(-1px, -1px)";
                          e.target.style.boxShadow = "4px 4px 0 #000000";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translate(0, 0)";
                          e.target.style.boxShadow = "3px 3px 0 #000000";
                        }}
                        required
                      />
                    </div>
                    <div style={styles.birthdayInputGroup}>
                      <label style={styles.label}>Recipient's Birthday:</label>
                      <input
                        type="date"
                        value={letterForm.toBirthday}
                        onChange={(e) =>
                          setLetterForm({
                            ...letterForm,
                            toBirthday: e.target.value,
                          })
                        }
                        style={styles.input}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translate(-1px, -1px)";
                          e.target.style.boxShadow = "4px 4px 0 #000000";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translate(0, 0)";
                          e.target.style.boxShadow = "3px 3px 0 #000000";
                        }}
                        required
                      />
                    </div>
                  </div>
                )}

                {letterForm.type === "encrypted" && (
                  <>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Security Question:</label>
                      <input
                        type="text"
                        value={letterForm.securityQuestion}
                        onChange={(e) =>
                          setLetterForm({
                            ...letterForm,
                            securityQuestion: e.target.value,
                          })
                        }
                        style={styles.input}
                        placeholder="e.g., What was the name of our first pet?"
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translate(-1px, -1px)";
                          e.target.style.boxShadow = "4px 4px 0 #000000";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translate(0, 0)";
                          e.target.style.boxShadow = "3px 3px 0 #000000";
                        }}
                        required
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        Security Answer (lowercase):
                      </label>
                      <input
                        type="text"
                        value={letterForm.securityAnswer}
                        onChange={(e) =>
                          setLetterForm({
                            ...letterForm,
                            securityAnswer: e.target.value,
                          })
                        }
                        style={styles.input}
                        placeholder="e.g., fluffy"
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translate(-1px, -1px)";
                          e.target.style.boxShadow = "4px 4px 0 #000000";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translate(0, 0)";
                          e.target.style.boxShadow = "3px 3px 0 #000000";
                        }}
                        required
                      />
                      <small
                        style={{
                          fontSize: "0.8rem",
                          color: "#666",
                          marginTop: "5px",
                          display: "block",
                        }}
                      >
                        Answer should be in lowercase letters, spaces allowed
                      </small>
                    </div>
                  </>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Letter Content:</label>
                  <textarea
                    value={letterForm.content}
                    onChange={(e) =>
                      setLetterForm({ ...letterForm, content: e.target.value })
                    }
                    rows="10"
                    style={styles.textarea}
                    placeholder="Write your letter here..."
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "5px 5px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    required
                  />
                </div>

                <button
                  onClick={handleSubmitLetter}
                  disabled={loading}
                  style={{
                    ...styles.button,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  <FiSend size={16} />
                  {loading ? "Sending..." : "Send Letter"}
                </button>
              </div>
            </div>
          )}

          {/* Read Letters Tab */}
          {activeTab === "read" && (
            <div>
              <h2
                style={{
                  marginBottom: "30px",
                  textAlign: "center",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontFamily: "Libertinus Mono",
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                Read Letters
              </h2>

              <p style={styles.titleTam}>
                The possibility of she reading your letter is 0.01%, but 200%
                probability that her husband will.
              </p>

              <div style={styles.searchContainer}>
                <div style={styles.searchRow}>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    style={{
                      ...styles.select,
                      flex: "0 0 auto",
                      width: "auto",
                      minWidth: "150px",
                      marginRight: "10px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                  >
                    <option value="both">Search From & To</option>
                    <option value="from">Search From Only</option>
                    <option value="to">Search To Only</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search letters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      ...styles.input,
                      flex: "1",
                      minWidth: "200px",
                      marginRight: "10px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                  />
                  <button
                    onClick={() => handleSearch(1)}
                    style={{
                      ...styles.button,
                      width: "auto",
                      padding: "12px 20px",
                      flex: "0 0 auto",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-2px, -2px)";
                      e.target.style.boxShadow = "6px 6px 0 #333333";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "4px 4px 0 #333333";
                    }}
                  >
                    <FiSearch size={16} />
                    Search
                  </button>
                </div>
              </div>

              <div>
                {searchResults.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      fontStyle: "italic",
                      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
                    }}
                  >
                    No letters found.
                  </p>
                ) : (
                  <>
                    {searchResults.map((letter) => (
                      <div key={letter.id} style={styles.letterCard}>
                        <div style={styles.letterHeader}>
                          <div>
                            <strong>From:</strong> {letter.from_name}
                          </div>
                          <div>
                            <strong>To:</strong> {letter.to_name}
                          </div>
                        </div>

                        <div style={styles.letterContent}>
                          {letter.letter_content}
                        </div>

                        <div style={styles.letterFooter}>
                          Sent on {formatDate(letter.created_at)}
                        </div>
                      </div>
                    ))}

                    <PaginationControls
                      onPageChange={handlePageChange}
                      pagination={pagination}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Private Letters Tab */}
          {activeTab === "private" && (
            <div>
              <h2
                style={{
                  marginBottom: "30px",
                  textAlign: "center",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontFamily: "Libertinus Mono",
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                View Private Letter
              </h2>

              <div style={styles.formContainer}>
                <p
                  style={{
                    marginBottom: "20px",
                    fontStyle: "italic",
                    fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
                  }}
                >
                  Enter the exact names and birthdays to view private letters.
                </p>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>From Name:</label>
                  <input
                    type="text"
                    value={privateForm.fromName}
                    onChange={(e) =>
                      setPrivateForm({
                        ...privateForm,
                        fromName: e.target.value,
                      })
                    }
                    style={styles.input}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>To Name:</label>
                  <input
                    type="text"
                    value={privateForm.toName}
                    onChange={(e) =>
                      setPrivateForm({ ...privateForm, toName: e.target.value })
                    }
                    style={styles.input}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                  />
                </div>

                <div style={styles.birthdayRow}>
                  <div style={styles.birthdayInputGroup}>
                    <label style={styles.label}>Sender's Birthday:</label>
                    <input
                      type="date"
                      value={privateForm.fromBirthday}
                      onChange={(e) =>
                        setPrivateForm({
                          ...privateForm,
                          fromBirthday: e.target.value,
                        })
                      }
                      style={styles.input}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translate(-1px, -1px)";
                        e.target.style.boxShadow = "4px 4px 0 #000000";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translate(0, 0)";
                        e.target.style.boxShadow = "3px 3px 0 #000000";
                      }}
                    />
                  </div>

                  <div style={styles.birthdayInputGroup}>
                    <label style={styles.label}>Recipient's Birthday:</label>
                    <input
                      type="date"
                      value={privateForm.toBirthday}
                      onChange={(e) =>
                        setPrivateForm({
                          ...privateForm,
                          toBirthday: e.target.value,
                        })
                      }
                      style={styles.input}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translate(-1px, -1px)";
                        e.target.style.boxShadow = "4px 4px 0 #000000";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translate(0, 0)";
                        e.target.style.boxShadow = "3px 3px 0 #000000";
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handlePrivateLetterSearch}
                  style={styles.button}
                >
                  <FiList size={16} />
                  Find Private Letters
                </button>
              </div>

              {showLetterSelection && privateLettersList.length > 0 && (
                <LetterSelectionList
                  letters={privateLettersList}
                  type="private"
                  onSelect={handlePrivateLetterView}
                />
              )}

              {searchResults.length > 0 &&
                searchResults[0].letter_type === "private" && (
                  <div style={{ ...styles.letterCard, marginTop: "30px" }}>
                    <div style={styles.letterHeader}>
                      <div>
                        <strong>From:</strong> {searchResults[0].from_name}
                      </div>
                      <div>
                        <strong>To:</strong> {searchResults[0].to_name}
                      </div>
                    </div>

                    <div style={styles.letterContent}>
                      {searchResults[0].letter_content}
                    </div>

                    <div style={styles.letterFooter}>
                      Sent on {formatDate(searchResults[0].created_at)}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Encrypted Letters Tab */}
          {activeTab === "encrypted" && (
            <div>
              <h2
                style={{
                  marginBottom: "30px",
                  textAlign: "center",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontFamily: "Libertinus Mono",
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                View Encrypted Letter
              </h2>

              <div style={styles.formContainer}>
                <p
                  style={{
                    marginBottom: "20px",
                    fontStyle: "italic",
                    fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
                  }}
                >
                  Enter the exact names and birthdays, then select and unlock an
                  encrypted letter.
                </p>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>From Name:</label>
                  <input
                    type="text"
                    value={encryptedForm.fromName}
                    onChange={(e) =>
                      setEncryptedForm({
                        ...encryptedForm,
                        fromName: e.target.value,
                      })
                    }
                    style={styles.input}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>To Name:</label>
                  <input
                    type="text"
                    value={encryptedForm.toName}
                    onChange={(e) =>
                      setEncryptedForm({
                        ...encryptedForm,
                        toName: e.target.value,
                      })
                    }
                    style={styles.input}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translate(-1px, -1px)";
                      e.target.style.boxShadow = "4px 4px 0 #000000";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translate(0, 0)";
                      e.target.style.boxShadow = "3px 3px 0 #000000";
                    }}
                  />
                </div>

                <div style={styles.birthdayRow}>
                  <div style={styles.birthdayInputGroup}>
                    <label style={styles.label}>Sender's Birthday:</label>
                    <input
                      type="date"
                      value={encryptedForm.fromBirthday}
                      onChange={(e) =>
                        setEncryptedForm({
                          ...encryptedForm,
                          fromBirthday: e.target.value,
                        })
                      }
                      style={styles.input}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translate(-1px, -1px)";
                        e.target.style.boxShadow = "4px 4px 0 #000000";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translate(0, 0)";
                        e.target.style.boxShadow = "3px 3px 0 #000000";
                      }}
                    />
                  </div>

                  <div style={styles.birthdayInputGroup}>
                    <label style={styles.label}>Recipient's Birthday:</label>
                    <input
                      type="date"
                      value={encryptedForm.toBirthday}
                      onChange={(e) =>
                        setEncryptedForm({
                          ...encryptedForm,
                          toBirthday: e.target.value,
                        })
                      }
                      style={styles.input}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translate(-1px, -1px)";
                        e.target.style.boxShadow = "4px 4px 0 #000000";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translate(0, 0)";
                        e.target.style.boxShadow = "3px 3px 0 #000000";
                      }}
                    />
                  </div>
                </div>

                {!showSecurityQuestion && (
                  <button
                    onClick={handleEncryptedLetterStep1}
                    style={styles.button}
                  >
                    <FiSearch size={16} />
                    Find Encrypted Letters
                  </button>
                )}
              </div>

              {showSecurityQuestion && encryptedLettersList.length > 0 && (
                <LetterSelectionList
                  letters={encryptedLettersList}
                  type="encrypted"
                  onUnlock={handleEncryptedLetterStep2}
                />
              )}

              {searchResults.length > 0 &&
                searchResults[0].letter_type === "encrypted" && (
                  <div style={{ ...styles.letterCard, marginTop: "30px" }}>
                    <div style={styles.letterHeader}>
                      <div>
                        <strong>From:</strong> {searchResults[0].from_name}
                      </div>
                      <div>
                        <strong>To:</strong> {searchResults[0].to_name}
                      </div>
                    </div>

                    <div style={styles.letterContent}>
                      {searchResults[0].letter_content}
                    </div>

                    <div style={styles.letterFooter}>
                      Sent on {formatDate(searchResults[0].created_at)}
                    </div>
                  </div>
                )}
            </div>
          )}
        </main>

        {/* Responsive GIF Section */}
        <div style={styles.gifContainer}>
          <h3
            style={{
              fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)",
              fontFamily: "Libertinus Mono",
              fontWeight: 400,
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            Letters That Last Forever.
          </h3>
          <img
            src={
              activeTab === "read"
                ? "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3Z2OXpwZ2ZwdXR2ODMxNG1yems2cnhtM2N5aTBzd3hnMHh3NWozNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3vR4CdLInXOhr3rO/giphy.gif"
                : activeTab === "write"
                ? "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2ozdmZ0c2FjODBqc2g1OG1panNsMTUxdTdrcWk1ZmI1OGQ4cnViciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/O8YQGdQapcRvW/giphy.gif"
                : activeTab === "private"
                ? "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXY1a2dwbTU2dmdhbHFqbGdkeDFwNnFhZTcwcGJib2R2YmhqcWJ5ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9xuPhLg78riXC/giphy.gif"
                : activeTab === "encrypted"
                ? "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTNpcWw2bjZnZjA2ZXdtazlmaHE4YzhoZmY2ODZrazd4cW0yM2lzaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cPNXOm7ln8HwK7UcbV/giphy.gif"
                : "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3Z2OXpwZ2ZwdXR2ODMxNG1yems2cnhtM2N5aTBzd3hnMHh3NWozNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3vR4CdLInXOhr3rO/giphy.gif"
            }
            alt="Interstellar - Messages across time and space"
            style={styles.gif}
          />
          <p
            style={{
              fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
              fontStyle: "italic",
              marginTop: "15px",
              color: "#666",
            }}
          >
            Send your thoughts across the digital cosmos.
          </p>
        </div>

        <footer style={styles.footer}>
          <p style={{ margin: "0", fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)" }}>
            © 2025 Graveletters - Letters that last forever <br />
              OpenSource - பிறப்பொக்கும் எல்லா உயிர்க்கும்{" "}
              <img src="/tvk.jpg" height="20px" alt="tvk" style={{ verticalAlign: "middle", borderRadius: 4 }} />
            <br />
            Made with 🖤 by{" "}
            <strong>
              <a
                href="https://blessl.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "red" }}
              >
                blessl.in
              </a>
            </strong>
          </p>
        </footer>
      </div>
    </>
  );
}
