const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require('mongoose');
const username = "srihari";
const password = "srihari";
const cluster = "cluster0.zkwgfmx";
const dbName = "blogDB";
const app = express();
//var home = require('../views/home.ejs'); 
const start = async () => {
  try {
    await mongoose.connect(`mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbName}`, 
    {useNewUrlParser: true}
    );
    app.listen(3000, () => console.log("Server started on port 3000"));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();

const homeStartingContent = "where ideas come to life through the strokes of words and imagination. Immerse yourself in a world of creativity, as we paint thoughts on this digital canvas. Here, you'll embark on a journey of inspiration, discovering stories, musings, and insights that ignite your mind and touch your soul. Unleash your inner artist and let your thoughts flow freely as we explore the boundless possibilities of this ever-evolving ThoughtCanvas. Happy reading and happy writing!";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const postSchema = new mongoose.Schema({

 title: String,
 content: String

});

const Post = mongoose.model("Post", postSchema);

app.get("/", async function(req, res){
  let allPosts=await Post.find();
  {
    //console.log("home:"+allPosts);
    res.render("home", {
      startingContent: homeStartingContent,
      posts: allPosts
      });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.get("/contact", function(req, res){
  res.render("contact");
});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", async function(req, res) {
  try {
    const newPost = new Post({
      title: req.body.postTitle,
      content: req.body.postBody
    });

    await newPost.save();
    res.redirect("/");
  } catch (err) {
    // Handle any errors that occur during the save operation
    console.error(err);
    // Respond with an appropriate error message
    res.status(500).send("An error occurred while saving the post.");
  }
});


app.get("/posts/:postId", async function(req, res){
  const requestedPostId = req.params.postId;

  let post=await Post.findOne({_id: requestedPostId}).exec();
    res.render("post", {
      title: post.title,
      content: post.content
    });
  
});

// // Set up the server route to handle the search request
app.get('/search', async function(req, res) {
  const query = req.query.query; // Assuming the search query is sent as a query parameter
  const regex = new RegExp(query, 'i');

  // Perform the Mongoose query to search for matching documents
  try {
    let searchResults;

    if (query) {
      searchResults = await Post.find({
        $or: [
          { title: regex },
          { content: regex }
        ]
      }).exec();
    } else {
      searchResults = await Post.find().exec();
      
    }
    res.render("home", {
        startingContent: homeStartingContent,
        posts: searchResults
    });

  //res.json(searchResults);
  //console.log("searchResults:"+searchResults);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while searching.' });
  }
});


