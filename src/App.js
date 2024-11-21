import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { Session } from "@inrupt/solid-client-authn-browser";
import { getSolidDataset, getThingAll, saveSolidDatasetAt, createThing, setThing } from "@inrupt/solid-client";

function App() {
  const session = new Session();
  const [loggedIn, setLoggedIn] = useState(false);
  const [webId, setWebId] = useState("");
  const [podUrl, setPodUrl] = useState("");
  const [data, setData] = useState([]);

  // Handle redirect after login
  useEffect(() => {
    const initSession = async () => {
      await session.handleIncomingRedirect(window.location.href);
      if (session.info.isLoggedIn) {
        setLoggedIn(true);
        setWebId(session.info.webId);
        console.log(`Logged in as ${session.info.webId}`);
      }
    };
    initSession();
  }, []);

  // Login function
  const login = async () => {
    try {
      await session.login({
        oidcIssuer: "https://solidcommunity.net", // Solid provider
        redirectUrl: window.location.origin, // Your app URL
        clientName: "My Solid React App",
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Read data from pod
  const readDataFromPod = async () => {
    try {
      if (!podUrl) {
        alert("Please enter a pod URL");
        return;
      }
      const dataset = await getSolidDataset(podUrl, { fetch: session.fetch });
      const items = getThingAll(dataset);
      setData(items); // Update state with retrieved data
      console.log("Data from pod:", items);
    } catch (error) {
      console.error("Failed to read data from pod:", error);
    }
  };

  // Write data to pod
  const writeDataToPod = async () => {
    try {
      if (!podUrl) {
        alert("Please enter a pod URL");
        return;
      }
      let dataset = await getSolidDataset(podUrl, { fetch: session.fetch });
      const thing = createThing({ name: "example" });
      dataset = setThing(dataset, thing);
      await saveSolidDatasetAt(podUrl, dataset, { fetch: session.fetch });
      alert("Data written to pod successfully!");
    } catch (error) {
      console.error("Failed to write data to pod:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>My Solid React App</h1>

        {/* Login Button */}
        {!loggedIn && <button onClick={login}>Login with Solid</button>}

        {/* User Info */}
        {loggedIn && (
          <div>
            <p>Logged in as: {webId}</p>
          </div>
        )}

        {/* Pod URL Input */}
        {loggedIn && (
          <div>
            <input
              type="text"
              placeholder="Enter your pod URL"
              value={podUrl}
              onChange={(e) => setPodUrl(e.target.value)}
            />
          </div>
        )}

        {/* Read and Write Buttons */}
        {loggedIn && (
          <div>
            <button onClick={readDataFromPod}>Read Data from Pod</button>
            <button onClick={writeDataToPod}>Write Data to Pod</button>
          </div>
        )}

        {/* Display Pod Data */}
        {data.length > 0 && (
          <div>
            <h3>Data from Pod:</h3>
            <ul>
              {data.map((item, index) => (
                <li key={index}>{JSON.stringify(item)}</li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;