---
description: How to deploy the Indest application using Docker
---

This workflow helps you deploy the application locally or prepare it for a server using Docker Compose.

1.  **Build and Start Containers**
    Builds the Docker images for frontend and backend and starts the database.
    ```bash
    docker-compose up -d --build
    ```

2.  **Check Container Status**
    Verifies that all containers are running correctly.
    ```bash
    docker-compose ps
    ```

3.  **View Backend Logs**
    If the backend isn't working, check the logs.
    ```bash
    docker-compose logs backend
    ```

4.  **View Frontend Logs**
    If the frontend isn't working, check the logs.
    ```bash
    docker-compose logs frontend
    ```
