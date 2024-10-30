require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const { ConnectMongoDb } = require("./connection/conn");
const { auth } = require("./middleware/auth");
const multer = require("multer");
const { User } = require("./Schema/User");
const uniqid = require("uniqid");
const Blog = require("./Schema/Blog");
const Notification = require("./Schema/Notification");
const Comment = require("./Schema/Comment");
const app = express();
app.get("/", (req, res) => {
  res.json({ msg: "Sujal" });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder to store images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});
const upload = multer({ storage });

ConnectMongoDb(process.env.DATABASE_URL)
  .then((result) => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log(err);
  });

const formatedDataToSend = (user) => {
  const access_token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};

app.post("/signup", async (req, res) => {
  const { fullname, email, password } = req.body;
  bcrypt.hash(password, 10, (err, hashed) => {
    if (err) throw err;
    let username = email.split("@")[0];
    let user = new User({
      personal_info: {
        fullname,
        email,
        password: hashed,
        username,
      },
    });

    user
      .save()
      .then((msg) => {
        return res.status(201).json({ user: formatedDataToSend(user) });
      })
      .catch((err) => {
        if (err.code == 11000) {
          return res.status(500).json({ error: "User Already Exists" });
        }
        return res.status(500).json({ error: "Something went wrong!!" });
      });
  });
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ "personal_info.email": email });
    if (!user) {
      return res.status(404).json({ error: "Email Not Found" }); // 404 for "Not Found"
    }
    const result = await bcrypt.compare(password, user.personal_info.password);
    if (!result) {
      return res.status(401).json({ error: "Incorrect Username or Password" }); // 401 for unauthorized access
    }
    return res.status(200).json(formatedDataToSend(user));
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error occurred, Please Try Again" });
  }
});

app.use("/uploads", express.static("uploads"));

app.post("/upload", upload.single("banner"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, imageUrl });
});

app.post("/create-blog", auth, async (req, res) => {
  try {
    const authorId = req.user;
    let { title, des, banner, tags, content, draft, id } = req.body;
    console.log(req.body);

    if (!title.length) {
      return res
        .status(403)
        .json({ error: "You must provide a title to publish the blog!" });
    }

    tags = tags.map((tag) => tag.toLowerCase());

    const blogId = id
      ? id
      : title
          .replace(/[^a-zA-Z0-9]/g, " ")
          .replace(/\s+/g, "-")
          .trim() + uniqid();

    if (id) {
      const result = await Blog.findOneAndUpdate(
        { blog_id: blogId },
        { title, des, banner, content, tags, draft: draft ? draft : false }
      );
      return res.status(200).json({ blogId });
    } else {
      const blog = new Blog({
        title,
        des,
        banner,
        content,
        tags,
        author: authorId,
        blog_id: blogId,
        draft: Boolean(draft),
      });
      const savedBlog = await blog.save();
      let incrementVal = draft ? 0 : 1;
      const updatedUser = await User.findOneAndUpdate(
        { _id: authorId },
        {
          $inc: { "account_info.total_posts": incrementVal },
          $push: {
            blogs: savedBlog._id,
          },
        },
        { new: true }
      );
      return res.status(201).json({ id: savedBlog.blog_id });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/latest-blogs", async (req, res) => {
  let { page } = req.body;
  const maxLimit = 5;
  try {
    const result = await Blog.find({ draft: false })
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id"
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(err.message);
  }
});

app.post("/all-latest-blogs-count", async (req, res) => {
  try {
    const result = await Blog.countDocuments({ draft: false });
    return res.status(200).json({ totalDocs: result });
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.post("/search-users", async (req, res) => {
  let { query } = req.body;
  try {
    const result = await User.find({
      "personal_info.username": new RegExp(query, "i"),
    })
      .limit(10)
      .select(
        "personal_info.fullname personal_info.username personal_info.profile_img -_id"
      );
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

app.post("/search-blogs", async (req, res) => {
  const { tag, page = 1, query, author, limit = 2, eliminate_blog } = req.body;

  let findQuery = { draft: false };

  if (tag) {
    findQuery.tags = tag;
    if (eliminate_blog) {
      findQuery.blog_id = { $ne: eliminate_blog };
    }
  } else if (query) {
    findQuery.title = new RegExp(query, "i");
  } else if (author) {
    findQuery.author = author;
  }

  const pageNumber = Math.max(1, parseInt(page, 10));

  try {
    const result = await Blog.find(findQuery)
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id"
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((pageNumber - 1) * limit)
      .limit(limit);

    return res.json(result);
  } catch (error) {
    console.error("Error fetching blogs:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/search-blogs-count", async (req, res) => {
  let { tag, query, author } = req.body;
  let findQuery;
  if (tag) {
    findQuery = { tags: tag, draft: false };
  } else if (query) {
    findQuery = { title: new RegExp(query, "i"), draft: false };
  } else if (author) {
    findQuery = { author, draft: false };
  }
  try {
    const result = await Blog.countDocuments(findQuery);
    return res.status(200).json({ totalDocs: result });
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.get("/trending-blogs", async (req, res) => {
  try {
    const result = await Blog.find({ draft: false })
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id"
      )
      .sort({
        "activity.total_read": -1,
        "activity.total_likes": -1,
        publishedAt: -1,
      })
      .select("blog_id title publishedAt -_id")
      .limit(5);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.post("/get-profile", async (req, res) => {
  let { username } = req.body;
  try {
    const result = await User.findOne({
      "personal_info.username": username,
    }).select("-personal_info.password -google_auth -updateAt -blogs");
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.post("/get-blog", async (req, res) => {
  try {
    const { blog_id, mode } = req.body;
    let incrementVal = mode != "edit" ? 1 : 0;

    const result = await Blog.findOneAndUpdate(
      { blog_id },
      { $inc: { "activity.total_reads": incrementVal } }
    )
      .populate(
        "author",
        "personal_info.fullname personal_info.username personal_info.profile_img"
      )
      .select("title des content banner activity publishedAt blog_id tags");

    await User.findOneAndUpdate(
      { "personal_info.username": result.author.personal_info.username },
      {
        $inc: { "account_info.total_reads": incrementVal },
      }
    ).catch((error) => {
      return res.status(500).json(error.message);
    });

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.post("/like-blog", auth, async (req, res) => {
  const user_id = req.user;
  const { _id, isLikedbyUser } = req.body;
  const incrementVal = !isLikedbyUser ? 1 : -1;
  try {
    await Blog.findOneAndUpdate(
      { _id },
      { $inc: { "activity.total_likes": incrementVal } }
    ).then((blog) => {
      try {
        if (!isLikedbyUser) {
          let like = new Notification({
            type: "like",
            blog: _id,
            notification_for: blog.author,
            user: user_id,
          });
          like.save().then((notification) => {
            return res.status(200).json({ liked_by_user: true });
          });
        } else {
          Notification.findOneAndDelete({
            user: user_id,
            blog: _id,
            type: "like",
          })
            .then((data) => {
              return res.status(200).json({ liked_by_user: false });
            })
            .catch((err) => {
              return res.status(500).json(err.message);
            });
        }
      } catch (error) {
        console.log(error);
      }
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.post("/isliked-by-user", auth, async (req, res) => {
  const user_id = req.user;
  const { _id } = req.body;
  Notification.exists({ user: user_id, type: "like", blog: _id })
    .then((result) => {
      return res.status(200).json({ result });
    })
    .catch((err) => {
      return res.status(500).json(err.message);
    });
});

app.post("/add-comment", auth, async (req, res) => {
  const user_id = req.user;
  const { _id, comment, blog_author } = req.body;
  if (!comment.length) {
    return res
      .status(403)
      .json({ error: "Write something to leave a comment" });
  }
  const commentsObj = new Comment({
    blog_id: _id,
    blog_author,
    comment,
    commented_by: user_id,
  });

  commentsObj.save().then(async (data) => {
    const { comment, commentedAt, children } = data;

    const result = await Blog.findOneAndUpdate(
      { _id },
      {
        $push: { comments: data._id },
        $inc: { "activity.total_comments": 1 },
        "activity.total_parent_comments": 1,
      }
    );

    const notificationObj = new Notification({
      type: "comment",
      blog: _id,
      notification_for: blog_author,
      user: user_id,
      comment: data._id,
    });

    notificationObj.save().then((data) => {
      console.log("New Notification created");
    });

    return res.status(201).json({
      comment,
      commentedAt,
      _id: data._id,
      user_id,
      children,
    });
  });
});

app.listen(8000, () => {
  console.log("http://localhost:8000");
});
