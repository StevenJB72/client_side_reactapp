import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { Session } from "@inrupt/solid-client-authn-browser";
import { getSolidDataset, getThingAll, getThing, getStringNoLocale, saveSolidDatasetAt, createThing, setThing } from "@inrupt/solid-client";

// Namespaces
const VCARD = "http://www.w3.org/2006/vcard/ns#";

function App() {
  const session = new Session();
  const [loggedIn, setLoggedIn] = useState(false);
  const [webId, setWebId] = useState("");
  const [podUrl, setPodUrl] = useState("");
  const [profileData, setProfileData] = useState({});
  const [data, setData] = useState([]);
  const [authFlow, setAuthFlow] = useState("");

  // Handle redirect after login
  useEffect(() => {
    const initSession = async () => {
      await session.handleIncomingRedirect(window.location.href);
      if (session.info.isLoggedIn) {
        setLoggedIn(true);
        setWebId(session.info.webId);
        console.log(`Logged in as ${session.info.webId}`);
        fetchProfileData(session.info.webId);
      }
    };
    initSession();
  }, []);

  // Login function
  const login = async (flow) => {
    try {
      setAuthFlow(flow);
      await session.login({
        oidcIssuer: "https://solidcommunity.net",
        redirectUrl: window.location.origin,
        clientName: `My Solid React App (${flow})`,
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const fetchProfileData = async (webId) => {
    try {
      const profileDataset = await getSolidDataset(webId, { fetch: session.fetch });
      const profile = getThing(profileDataset, webId);
  
      // Basic details
      const name = getStringNoLocale(profile, VCARD.fn) || "No name found";
      const role = getStringNoLocale(profile, VCARD.role) || "No role found";
      const organization = getStringNoLocale(profile, VCARD.organization_name) || "No organization found";
      const note = getStringNoLocale(profile, VCARD.note) || "No note found";
  
      // Address (nested data)
      const addressNode = getThing(profileDataset, getStringNoLocale(profile, VCARD.hasAddress));
      const street = addressNode ? getStringNoLocale(addressNode, VCARD["street-address"]) : "No street address found";
      const postalCode = addressNode ? getStringNoLocale(addressNode, VCARD["postal-code"]) : "No postal code found";
      const country = addressNode ? getStringNoLocale(addressNode, VCARD["country-name"]) : "No country found";
  
      // Telephone (nested data)
      const phoneNode = getThing(profileDataset, getStringNoLocale(profile, VCARD.hasTelephone));
      const phone = phoneNode ? getStringNoLocale(phoneNode, VCARD.value) : "No phone number found";
  
      // Set state with all retrieved details
      setProfileData({
        name,
        role,
        organization,
        note,
        address: { street, postalCode, country },
        phone,
      });
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
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

        {/* Login Buttons for Different OAuth Flows */}
        {!loggedIn && (
          <div>
            <button className="login-button google" onClick={() => login("PKCE")}>
              Login with PKCE
            </button>
            <button className="login-button microsoft" onClick={() => login("Implicit")}>
              Login with Implicit Flow
            </button>
            <button className="login-button custom" onClick={() => login("Authorization Code")}>
              Login with Authorization Code Flow
            </button>
          </div>
        )}

        {/* User Info */}
        {loggedIn && (
          <div>
            <p>Logged in as: {webId}</p>
            <h3>Authentication Flow: {authFlow}</h3>
          </div>
        )}

        {/* Profile Data */}
        {loggedIn && profileData.name && (
  <div className="profile">
    <h3>Profile Information:</h3>
    <p><strong>Name:</strong> {profileData.name}</p>
    <p><strong>Role:</strong> {profileData.role}</p>
    <p><strong>Organization:</strong> {profileData.organization}</p>
    <p><strong>Note:</strong> {profileData.note}</p>
    <h4>Address:</h4>
    <p><strong>Street:</strong> {profileData.address?.street}</p>
    <p><strong>Postal Code:</strong> {profileData.address?.postalCode}</p>
    <p><strong>Country:</strong> {profileData.address?.country}</p>
    <h4>Contact:</h4>
    <p><strong>Phone:</strong> {profileData.phone}</p>
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
            <button onClick={readDataFromPod} className="read-button">Read Data from Pod</button>
            <button onClick={writeDataToPod} className="write-button">Write Data to Pod</button>
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