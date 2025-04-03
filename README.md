# Book Kin Dev Environment & Testing Checklist

This guide covers the steps to run the backend server, the frontend app on an emulator, and test the Bluesky OAuth login flow locally.

**Prerequisites:**

* Node.js, Bun (or npm/yarn) installed.
* Docker installed and running (and user added to `docker` group).
* Android Studio installed with Android SDK and at least one AVD (emulator) created.
* `ngrok` installed and authenticated (`ngrok config add-authtoken ...`).
* Project dependencies installed (`bun install` or `npm install` in both backend and frontend directories).

**1. Start Backend Services:**

* **Start MongoDB Container:**
    * Open a terminal.
    * If the container `book-kin-db` isn't running, start it:
        ```bash
        docker start book-kin-db
        ```
    * Verify it's running: `docker ps`

* **Configure Backend `.env`:**
    * Navigate to the `book-kin-backend` directory.
    * Ensure your `.env` file exists and contains **correct values** for:
        * `MONGO_URI=mongodb://admin:password@127.0.0.1:27020/atproto-oauth?authSource=admin` (Using specific IP `127.0.0.1` and correct port/creds).
        * `CLIENT_URI=https://<YOUR_NGROK_URL>/client-metadata.json`
        * `APP_BASE_DEEPLINK=bookkin://callback` (For mobile testing via deep link).
        * `PRIVATE_KEY_1="..."` (Your actual PKCS#8 key, formatted with `\n`).
        * `JWT_SECRET=YOUR_SECURE_SECRET_FOR_APP_TOKENS` (Add this for JWT generation).
        * `PORT=8080` (Or your chosen backend port).
    * *Note: You'll set `<YOUR_NGROK_URL>` in the next step.*

* **Start Backend Server:**
    * In the `book-kin-backend` terminal, run:
        ```bash
        bun run dev
        ```
    * Wait for it to log that it's connected to the DB and listening on port 8080.

**2. Start Ngrok Tunnel:**

* **Open a NEW Terminal Window.**
* Run ngrok to expose your backend port (e.g., 8080):
    ```bash
    ngrok http 8080
    ```
* **Copy the `https://...ngrok-free.app` URL.**
* **Update Backend `.env`:** Paste the copied ngrok URL into the `CLIENT_URI` variable in your backend `.env` file.
* **Restart Backend Server:** Stop (`Ctrl+C`) and restart the backend server (`npm run dev | yarn dev`) so it uses the updated ngrok URLs.
* **Keep the ngrok terminal open!**

**3. Start Android Emulator & Frontend App:**

* **Launch Emulator:**
    * Open Android Studio.
    * Go to `Tools` > `Device Manager`.
    * Click the "Play" button next to your desired AVD (e.g., Pixel_8_Pro).
    * Wait for the emulator to fully boot up.

* **Configure Frontend API URL:**
    * Navigate to the `book-kin` (frontend) project directory.
    * Open the file containing `LoginForm.tsx` (or wherever `API_BASE_URL` is defined).
    * Ensure `API_BASE_URL` points to your **computer's local network IP** and the backend port:
        ```typescript
        // Example: Replace with your actual IP
        const API_BASE_URL = "[http://192.168.0.62:8080](http://192.168.0.62:8080)";
        ```

* **Start Frontend & Install on Emulator:**
    * In the `book-kin` (frontend) terminal, run:
        ```bash
        npx expo run:android
        ```
    * Expo should detect the running emulator, build the app, install it, and launch it. Wait for the app to open on the emulator.

**4. Test the Login Flow:**

* **Navigate:** In the app running on the emulator, go to the Login screen.
* **Enter Handle:** Type a valid Bluesky handle you can log in with (e.g., `peafield.bsky.social`).
* **Tap Login:** Press the "Login with Bluesky" button.
* **Browser Opens:** A web browser *inside the emulator* should open and navigate to the Bluesky login/authorization page.
* **Authorize:** Log in to Bluesky and approve the request for the "Book Kin (dev)" app.
* **Redirect Back:** After authorization, the browser should close, and your "Book Kin" app should reopen automatically.
* **Check App:** You should be navigated to the `/library` screen, and the profile information (avatar, handle, etc.) should be displayed.
* **Check Logs:** Monitor the backend and frontend terminal logs for any errors during the callback or profile display.

---
Keep this handy! It should streamline getting your development session started each time.