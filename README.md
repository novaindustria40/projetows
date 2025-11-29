<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ZapScale SaaS

This repository contains the source code for the ZapScale SaaS application, a powerful tool for managing WhatsApp campaigns and messages.

## Features

*   **Campaign Management:** Create, edit, and delete campaigns.
*   **Message Scheduling:** Schedule messages to be sent at a specific time.
*   **WhatsApp Integration:** Connect to your WhatsApp account and send messages directly from the application.
*   **Dashboard:** Monitor your campaigns and messages from a single dashboard.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Backend:** Node.js, Express
*   **Database:** MongoDB
*   **Real-time Communication:** Socket.io
*   **WhatsApp Integration:** whatsapp-web.js

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/)
*   [Docker](https://www.docker.com/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/zapscale-saas.git
    cd zapscale-saas
    ```

2.  **Create a `.env` file:**

    Create a `.env` file in the root of the project and add your MongoDB connection string:

    ```
    MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database-name>
    ```

3.  **Build and run the application:**

    The `build_and_run.sh` script will build the Docker image and start the container.

    ```bash
    ./build_and_run.sh
    ```

    Your application should now be running on `http://localhost`.

## Usage

1.  Open your web browser and navigate to `http://localhost`.
2.  Create an account or log in with your existing credentials.
3.  Connect your WhatsApp account by scanning the QR code.
4.  Start creating and managing your campaigns.

## Scripts

*   `build_and_run.sh`: Builds the Docker image and starts the container.
*   `update.sh`: Pulls the latest changes from the repository, rebuilds the image, and restarts the container.
*   `deploy.ps1`: Deploys the application to AWS ECS.
*   `setup.ps1`: Sets up the initial environment for the application.
*   `install_dependencies.sh`: Installs the dependencies for the application.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
