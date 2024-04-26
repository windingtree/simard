import express from "express";
import cors from "cors";
import { jsonResponse } from "./helpers/responseUtils";
import { CustomError, errorHandler } from "./helpers/errorUtils";
import { v1Router } from "./routes";
import { loggerMW } from "./middleware/loggerMW";

// create express app
const app = express();

// set up CORS
app.use(cors());

// include middleware to enable json body parsing and nested objects
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ignore favicon requests
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
  return;
});

// base routes
app.get(/^\/(api)?\/?$/, (req, res) => {
  return jsonResponse(res, 200, undefined, "It's Alive!");
});

app.get(/^(\/api)?\/v1\/ping\/?$/, (req, res) => {
  return jsonResponse(res, 200, undefined, "Pong!");
});

// add logger middleware
app.use(loggerMW());

// load all defined routes
app.use(/^(\/api)?\/v1/, v1Router);

// routes not found go here
app.all("*", (req, res, next) => {
  const error = new CustomError(404, "Resource not found!");
  next(error);
});

// default error handler
app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

export default app;
