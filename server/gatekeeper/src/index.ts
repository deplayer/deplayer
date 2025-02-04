import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const rpName = "Deplayer";
const rpID = process.env.RP_ID || "localhost";
const origin = process.env.ORIGIN || `http://${rpID}:5173`;

// Store challenges temporarily (should use Redis in production)
const challengeStore = new Map<string, string>();

// Proxy middleware to Electric
app.use("/electric", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // Forward the request to Electric
    const response = await fetch(`${process.env.ELECTRIC_URL}${req.url}`, {
      method: req.method,
      headers: {
        ...req.headers,
        Authorization: `Bearer ${process.env.ELECTRIC_SIGNING_KEY}`,
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Registration endpoint
app.post("/register", async (req, res) => {
  const { username, displayName } = req.body;

  try {
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: username,
      userName: username,
      userDisplayName: displayName,
      attestationType: "none",
    });

    challengeStore.set(username, options.challenge);

    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate registration options" });
  }
});

// Registration verification endpoint
app.post("/register/verify", async (req, res) => {
  const { username, credential } = req.body;
  const challenge = challengeStore.get(username);

  if (!challenge) {
    return res.status(400).json({ error: "Challenge not found" });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      // Store the credential in Supabase
      const { error } = await supabase.from("credentials").insert({
        user_id: username,
        credential_id:
          verification.registrationInfo?.credentialID.toString("base64"),
        public_key:
          verification.registrationInfo?.credentialPublicKey.toString("base64"),
        counter: verification.registrationInfo?.counter,
      });

      if (error) throw error;

      const token = jwt.sign({ username }, process.env.JWT_SECRET!);
      res.json({ token });
    } else {
      res.status(400).json({ error: "Verification failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Verification failed" });
  } finally {
    challengeStore.delete(username);
  }
});

// Authentication endpoint
app.post("/auth", async (req, res) => {
  const { username } = req.body;

  try {
    const { data: credentials } = await supabase
      .from("credentials")
      .select()
      .eq("user_id", username)
      .single();

    if (!credentials) {
      return res.status(404).json({ error: "User not found" });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [
        {
          id: Buffer.from(credentials.credential_id, "base64"),
          type: "public-key",
        },
      ],
    });

    challengeStore.set(username, options.challenge);

    res.json(options);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to generate authentication options" });
  }
});

// Authentication verification endpoint
app.post("/auth/verify", async (req, res) => {
  const { username, credential } = req.body;
  const challenge = challengeStore.get(username);

  if (!challenge) {
    return res.status(400).json({ error: "Challenge not found" });
  }

  try {
    const { data: credentials } = await supabase
      .from("credentials")
      .select()
      .eq("user_id", username)
      .single();

    if (!credentials) {
      return res.status(404).json({ error: "User not found" });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: Buffer.from(credentials.public_key, "base64"),
        credentialID: Buffer.from(credentials.credential_id, "base64"),
        counter: credentials.counter,
      },
    });

    if (verification.verified) {
      // Update the counter
      await supabase
        .from("credentials")
        .update({ counter: verification.authenticationInfo.newCounter })
        .eq("user_id", username);

      const token = jwt.sign({ username }, process.env.JWT_SECRET!);
      res.json({ token });
    } else {
      res.status(400).json({ error: "Verification failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Verification failed" });
  } finally {
    challengeStore.delete(username);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Gatekeeper service running on port ${port}`);
});
