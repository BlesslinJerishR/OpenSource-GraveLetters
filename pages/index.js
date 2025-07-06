// pages/index.js
import React, { useState, useEffect } from "react";
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
} from "react-icons/fi";

export default function Graveletters() {
  const [activeTab, setActiveTab] = useState("write");
  const [letters, setLetters] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("both");
  const [loading, setLoading] = useState(false);

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
    loadLetters();
  }, []);

  const loadLetters = async () => {
    try {
      const response = await fetch("/api/letters");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Loaded letters:", data);
      setLetters(data.letters || []);
      setSearchResults(data.letters || []);
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

  const handleSubmitLetter = async () => {
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
          loadLetters();
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
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        searchType: searchType,
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();
      setSearchResults(data.letters || []);
    } catch (error) {
      console.error("Error searching letters:", error);
    }
  };

  const handlePrivateLetterView = async () => {
    try {
      const params = new URLSearchParams({
        type: "private",
        fromName: privateForm.fromName,
        toName: privateForm.toName,
        fromBirthday: privateForm.fromBirthday,
        toBirthday: privateForm.toBirthday,
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();

      if (data.letters && data.letters.length > 0) {
        setSearchResults(data.letters);
        alert("Private letter found!");
      } else {
        setSearchResults([]);
        alert("No letter found with those details.");
      }
    } catch (error) {
      console.error("Error finding private letter:", error);
      alert("Error searching for private letter.");
    }
  };

  const handleEncryptedLetterStep1 = async () => {
    try {
      const params = new URLSearchParams({
        type: "encrypted",
        fromName: encryptedForm.fromName,
        toName: encryptedForm.toName,
        fromBirthday: encryptedForm.fromBirthday,
        toBirthday: encryptedForm.toBirthday,
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();

      if (
        data.letters &&
        data.letters.length > 0 &&
        data.letters[0].security_question
      ) {
        setEncryptedForm({
          ...encryptedForm,
          securityQuestion: data.letters[0].security_question,
        });
        setShowSecurityQuestion(true);
      } else {
        alert("No encrypted letter found with those details.");
        setShowSecurityQuestion(false);
      }
    } catch (error) {
      console.error("Error finding encrypted letter:", error);
      alert("Error searching for encrypted letter.");
    }
  };

  const handleEncryptedLetterStep2 = async () => {
    try {
      const params = new URLSearchParams({
        type: "encrypted",
        fromName: encryptedForm.fromName,
        toName: encryptedForm.toName,
        fromBirthday: encryptedForm.fromBirthday,
        toBirthday: encryptedForm.toBirthday,
        securityAnswer: encryptedForm.securityAnswer,
      });

      const response = await fetch(`/api/letters?${params}`);
      const data = await response.json();

      if (data.letters && data.letters.length > 0) {
        setSearchResults(data.letters);
        alert("Encrypted letter unlocked!");
      } else {
        alert("Incorrect answer. Please try again.");
      }
    } catch (error) {
      console.error("Error unlocking encrypted letter:", error);
      alert("Error unlocking encrypted letter.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const styles = {
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
        linear-gradient(90deg, transparent 79px, #e0e0e0 79px, #e0e0e0 81px, transparent 81px),
        linear-gradient(#f8f8f8 0.1em, transparent 0.1em)
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
        linear-gradient(90deg, transparent 79px, #e8e8e8 79px, #e8e8e8 80px, transparent 80px),
        linear-gradient(#f9f9f9 0.1em, transparent 0.1em)
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
  };

  return (
    <>
      <Head>
        <title>Graveletters - Send letters that last forever</title>
        <meta
          name="description"
          content="Send anonymous, public, private, or encrypted letters that last forever"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="https://img.icons8.com/3d-fluency/100/grave.png"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Libertinus+Mono&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>
            {" "}
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
          {[
            { key: "write", label: "Write Letter.", icon: FiEdit3 },
            { key: "read", label: "Read Letters", icon: FiBook },
            { key: "private", label: "Private Letters", icon: FiLock },
            { key: "encrypted", label: "Encrypted Letters", icon: FiShield },
            { key: "host", label: "Self Host > Open Source", icon: FiGithub },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === "host") {
                    window.open(
                      "https://github.com/BlesslinJerishR/OpenSource-GraveLetters",
                      "_blank"
                    );
                  } else {
                    setActiveTab(tab.key);
                  }
                }}
                style={{
                  ...styles.navButton,
                  backgroundColor:
                    tab.key === "host"
                      ? "#00FF00"
                      : activeTab === tab.key
                      ? "#000000"
                      : "#ffffff",
                  color:
                    tab.key === "host"
                      ? "#000000"
                      : activeTab === tab.key
                      ? "#ffffff"
                      : "#000000",
                  boxShadow: tab.key === "host" ? "0 3px 0 #00CC00" : undefined,
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
                  <>
                    <div style={styles.inputGroup}>
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
                    <div style={styles.inputGroup}>
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
                  </>
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
                    onClick={handleSearch}
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
                  searchResults.map((letter) => (
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
                  ))
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
                  Enter the exact names and birthdays to view a private letter.
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

                <div style={styles.inputGroup}>
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

                <div style={styles.inputGroup}>
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

                <button onClick={handlePrivateLetterView} style={styles.button}>
                  <FiEye size={16} />
                  View Private Letter
                </button>

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
                  Enter the exact names and birthdays, then answer the security
                  question to view an encrypted letter.
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

                <div style={styles.inputGroup}>
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

                <div style={styles.inputGroup}>
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

                {!showSecurityQuestion && (
                  <button
                    onClick={handleEncryptedLetterStep1}
                    style={styles.button}
                  >
                    <FiSearch size={16} />
                    Find Security Question
                  </button>
                )}

                {showSecurityQuestion && (
                  <>
                    <div
                      style={{
                        ...styles.inputGroup,
                        ...styles.securityQuestionBox,
                      }}
                    >
                      <strong>Security Question:</strong>
                      <p style={{ margin: "10px 0 0 0", fontStyle: "italic" }}>
                        {encryptedForm.securityQuestion}
                      </p>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        Your Answer (lowercase):
                      </label>
                      <input
                        type="text"
                        value={encryptedForm.securityAnswer}
                        onChange={(e) =>
                          setEncryptedForm({
                            ...encryptedForm,
                            securityAnswer: e.target.value,
                          })
                        }
                        style={styles.input}
                        placeholder="Enter your answer in lowercase"
                      />
                    </div>

                    <button
                      onClick={handleEncryptedLetterStep2}
                      style={styles.button}
                    >
                      <FiKey size={16} />
                      Unlock Letter
                    </button>
                  </>
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
            src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3Z2OXpwZ2ZwdXR2ODMxNG1yems2cnhtM2N5aTBzd3hnMHh3NWozNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3vR4CdLInXOhr3rO/giphy.gif"
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
