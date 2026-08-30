# YouTube-Style Backend API

A REST API for a video-sharing platform, built as a backend engineering project.

## Features

- User registration, login, refresh tokens, and profile management
- Video upload and publishing workflows
- Comments, likes, playlists, subscriptions, and tweets
- Channel dashboard and health-check routes
- Cloudinary media storage and MongoDB persistence

## Tech stack

Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Cloudinary, Multer

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Temporary uploads stay under `public/temp` and are excluded from Git.
