const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM invoices");
    if (!results.rows.length) throw new ExpressError("No invoices found", 404);
    return res.json({ invoices: results.rows });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      "SELECT * FROM invoices INNER JOIN companies ON invoices.comp_code=companies.code WHERE id=$1",
      [id]
    );
    if (!results.rows.length)
      throw new ExpressError("No invoice can be found with associated id", 404);

    const {
      comp_code,
      amt,
      paid,
      add_date,
      paid_date,
      code,
      name,
      description,
    } = results.rows[0];

    return res.json({
      invoice: { id, comp_code, amt, paid, add_date, paid_date },
      company: { code, name, description },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1,$2) RETURNING *",
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let { amt, paid } = req.body;
    const payInfo = await db.query(
      "SELECT paid, paid_date FROM invoices WHERE id=$1",
      [id]
    );
    if (!payInfo.rows.length)
      throw new ExpressError("No invoice associated with id", 404);
    let { paid_date } = payInfo.rows[0];
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0");
    let yyyy = today.getFullYear();

    today = yyyy + "-" + mm + "-" + dd;

    if (paid && paid_date) {
      paid_date = paid_date;
    }
    if (paid && !paid_date) {
      paid_date = today;
    } else {
      paid_date = null;
    }
    const results = await db.query(
      "UPDATE invoices SET amt=$2,paid=$3,paid_date=$4 WHERE id=$1 RETURNING *",
      [id, amt, paid, paid_date]
    );

    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const valid = await db.query("SELECT * FROM invoices WHERE id=$1", [id]);
    if (!valid.rows.length) throw new ExpressError("Code not found", 404);
    const results = await db.query("DELETE FROM invoices WHERE id=$1", [id]);
    return res.json({ status: "Deleted" });
  } catch (e) {
    next(e);
  }
});

router.post;

module.exports = router;
