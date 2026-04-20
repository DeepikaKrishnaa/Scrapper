import { useState } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setError("");
    setSearched(true);
    setLoading(true);
    setEmails([]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/search?q=${query}`);

      if (res.status === 401) {
        setError("You have to login first");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setEmails(data);
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="container">

      <div className="top-bar">
        <button
          className="button"
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
          }}
        >
          Login with Google
        </button>
      </div>

      <div className="center">
        <h1>Scrapper</h1>

        <div className="search-box">
          <input
            className="input"
            type="text"
            placeholder="Enter keyword"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="button" onClick={handleSearch}>
            Search
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="email-container">

          {!loading && !error && emails.length === 0 && searched && (
            <p className="no-results">
              No emails found with the entered keyword
            </p>
          )}

          {!loading && emails.map((mail) => (
            <div key={mail.id} className="card">
              <p><strong>Subject:</strong> {mail.subject}</p>
              <p><strong>From:</strong> {mail.from}</p>
              <p><strong>Snippet:</strong> {mail.snippet}</p>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}

export default App;