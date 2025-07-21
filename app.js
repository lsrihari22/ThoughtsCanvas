// ------------------------
// IMPORTS & CONFIG
// ------------------------
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const slugify = require("slugify");

const app = express();

// ------------------------
// DATABASE CONNECTION
// ------------------------
const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const cluster = "cluster0.zkwgfmx";
const dbName = "blogDB";

const start = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbName}`,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ DB Connection Error:", error);
    process.exit(1);
  }
};

start();

// ------------------------
// MIDDLEWARES
// ------------------------
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// ------------------------
// MODELS
// ------------------------
const postSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    slug:{ type: String, unique: true}
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

// ------------------------
// ROUTES
// ------------------------

const homeStartingContent =
  "Where ideas come to life through the strokes of words and imagination...";

app.get("/", async function (req, res) {
  try {
    const perPage = 6; // Number of posts per page
    const page = parseInt(req.query.page) || 1; // Current page from URL, default = 1

    const totalPosts = await Post.countDocuments();

    const posts = await Post.find()
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    res.render("home", {
      startingContent: homeStartingContent,
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / perPage),
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { message: "Failed to load posts." });
  }
});


app.get("/about", (req, res) => res.render("about"));
app.get("/contact", (req, res) => res.render("contact"));
app.get("/compose", (req, res) => res.render("compose"));

app.post("/compose", async function(req, res) {
  try {
    let baseSlug = slugify(req.body.postTitle, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists, if yes, append -1, -2, etc.
    while (await Post.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newPost = new Post({
      title: req.body.postTitle,
      content: req.body.postBody,
      slug: slug
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while saving the post.");
  }
});


app.get("/posts/:slug", async function(req, res) {
  try {
    const post = await Post.findOne({ slug: req.params.slug });

    if (!post) {
      return res.status(404).render("error", { message: "Post not found." });
    }

    res.render("post", {
      title: post.title,
      content: post.content
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { message: "Error fetching post." });
  }
});


// ------------------------
// SEARCH (Fixed)
// ------------------------
app.get('/search', async function(req, res) {
  const query = req.query.query?.trim() || "";
  console.log("🔍 Searching for:", query);

  try {
    let searchResults = [];

    if (query.length > 0) {
      const regex = new RegExp(query, "i");
      searchResults = await Post.find({
        $or: [{ title: regex }, { content: regex }]
      }).exec();
    } else {
      searchResults = await Post.find().exec();
    }

    res.render("home", {
      startingContent: homeStartingContent,
      posts: searchResults
    });

  } catch (err) {
    console.error(err);
    res.status(500).render("error", { message: "Search failed." });
  }
});

// ------------------------
// ERROR HANDLER
// ------------------------
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).render("error", { message: "Something went wrong!" });
});
