const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const { default: slugify } = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM companies");
    if (!results.rows.length)
      throw new ExpressError("No companies present", 404);
    return res.json({ companies: results.rows });
  } catch (e) {
    next(e);
  }
});

router.get("/industries", async (req, res, next) => {
  try {
    const results = await db.query(
      "SELECT i.code, i.industry, f.company_code FROM industries AS i LEFT JOIN field AS f ON i.code=f.ind_code"
    );
    if (!results.rows.length) throw new ExpressError("Database empty", 404);
    return res.json({ industries: results.rows });
  } catch (e) {
    next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      "SELECT c.code, c.name, c.description, f.ind_code FROM companies AS c INNER JOIN field AS f ON c.code=f.company_code WHERE c.code=$1",
      [code]
    );
    if (!results.rows.length)
      throw new ExpressError("Code not found in Database", 404);
    const { name, description } = results.rows[0];
    const fields = results.rows.map((f) => f.ind_code);
    return res.json({ code, name, description, fields });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const slug = slugify(code, { remove: " ", lower: true, strict: true });

    const results = await db.query(
      "INSERT INTO companies (code,name,description) VALUES ($1,$2,$3) RETURNING code,name,description",
      [slug, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.patch("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *",
      [name, description, code]
    );
    if (!results.rows.length) throw new ExpressError("Code not found", 404);
    return res.json({ company: results.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const valid = await db.query("SELECT * FROM companies WHERE code=$1", [
      code,
    ]);
    if (!valid.rows.length) throw new ExpressError("Code not found", 404);
    const results = await db.query("DELETE FROM companies WHERE code=$1", [
      code,
    ]);
    return res.json({ status: "Deleted" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
