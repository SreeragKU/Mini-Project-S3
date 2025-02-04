import Post from "../models/post";
import Category from "../models/category";
import slugify from "slugify";
import cloudinary from "cloudinary";
import Media from "../models/media";
import User from "../models/user";
import Comment from "../models/comment";
import Draft from "../models/draft";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const uploadImage = async (req, res) => {
  try {
    // console.log(req.body);
    const result = await cloudinary.uploader.upload(req.body.image);
    // console.log(result);
    res.json(result.secure_url);
  } catch (err) {
    console.log(err);
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, content, volumes, categories, coverImage } = req.body;

    if (!title || !content || !volumes || !categories || !coverImage) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const alreadyExist = await Post.findOne({
      slug: slugify(title.toLowerCase()),
    });
    if (alreadyExist) return res.status(400).json({ error: "Title is taken" });

    const categoryIds = await Promise.all(
      categories.map(async (category) => {
        const existingCategory = await Category.findOne({ name: category });
        return existingCategory ? existingCategory._id : null;
      })
    );

    const formattedVolumes = volumes.map((volume) => ({
      volume: volume.volume,
      chapters: volume.chapters.map((chapter) => ({
        chapter: chapter.chapter,
        name: chapter.name,
        content: chapter.content,
      })),
    }));

    const post = await new Post({
      title,
      content,
      volumes: formattedVolumes,
      categories: categoryIds.filter((categoryId) => categoryId),
      coverImage,
      postedBy: req.user._id,
      slug: slugify(title),
    }).save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { posts: post._id },
    });

    return res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const singlePost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({ slug })
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("coverImage", "url")
      .populate({
        path: "volumes",
        populate: {
          path: "chapters",
          select: "chapter name content",
        },
      });
    const comments = await Comment.find({ postId: post._id })
      .populate("postedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ post, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, volumes, coverImage, categories } = req.body;

    // Get category ids based on category name
    const categoryIds = await Promise.all(
      categories.map(async (category) => {
        const existingCategory = await Category.findOne({ name: category });
        return existingCategory ? existingCategory._id : null;
      })
    );

    // Adjust the volumes and chapters data
    const formattedVolumes = volumes.map((volume) => ({
      volume: volume.volume,
      chapters: volume.chapters.map((chapter) => ({
        chapter: chapter.chapter,
        name: chapter.name,
        content: chapter.content,
      })),
    }));

    // Update post
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        title,
        slug: slugify(title),
        volumes: formattedVolumes,
        categories: categoryIds.filter((categoryId) => categoryId),
        coverImage,
      },
      { new: true }
    )
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("coverImage", "url")
      .populate({
        path: "volumes",
        populate: {
          path: "chapters",
          select: "chapter name content",
        },
      });

    res.json(post);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const posts = async (req, res) => {
  try {
    const all = await Post.find()
      .populate("coverImage")
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("volumes.chapters", "name content")
      .populate("commentCount")
      .sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const postsPage = async (req, res) => {
  try {
    const perPage = 5;
    const page = req.params.page || 1;

    const all = await Post.find()
      .skip((page - 1) * perPage)
      .populate("coverImage")
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .sort({ createdAt: -1 })
      .limit(perPage);
    res.json(all);
  } catch (err) {
    console.log(err);
  }
};

export const uploadImageFile = async (req, res) => {
  try {
    //console.log(req.files);
    const result = await cloudinary.uploader.upload(req.files.file.path);
    // save to db
    const media = await new Media({
      url: result.secure_url,
      public_id: result.public_id,
      postedBy: req.user._id,
    }).save();
    res.json(media);
  } catch (err) {
    console.log(err);
  }
};

export const media = async (req, res) => {
  try {
    const media = await Media.find()
      .populate("postedBy", "_id")
      .sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    console.log(err);
  }
};

export const removeMedia = async (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = await Media.findByIdAndDelete(mediaId);
    if (!media) {
      return res.status(404).json({ error: "Media not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removePost = async (req, res) => {
  try {
    const postId = req.params.postId;

    // Find the post and remove it
    const post = await Post.findByIdAndDelete(postId);

    // If the post was successfully removed, update the user model
    if (post) {
      // Find the user by the post's author
      const user = await User.findOne({ posts: postId });

      // Remove the post from the user's posts array
      if (user) {
        user.posts.pull(postId);
        await user.save();
      }

      res.json({ ok: true });
    } else {
      res.json({ ok: false, error: "Post not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
};

export const postByAuthor = async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.user._id })
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("coverImage", "url")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

export const postCount = async (req, res) => {
  try {
    const count = await Post.countDocuments();
    res.json(count);
  } catch (err) {
    console.log(err);
  }
};

export const postsForAdmin = async (req, res) => {
  try {
    const all = await Post.find()
      .populate("coverImage")
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("volumes.chapters", "name content")
      .sort({ createdAt: -1 });

    res.json(all);
  } catch (err) {
    console.log(err);
  }
};

export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;

    if (!postId || !comment) {
      return res.status(400).json({ error: "postId and comment are required" });
    }

    const newComment = await Comment.create({
      content: comment,
      postedBy: req.user._id,
      postId,
    });

    // Increment commentCount of the associated post
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    // Populate the 'postedBy' field for response
    const populatedComment = await Comment.findById(newComment._id)
      .populate("postedBy", "name")
      .exec();

    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const comments = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page || 1;

    const allComments = await Comment.find()
      .skip((page - 1) * perPage)
      .populate("postedBy", "name")
      .populate("postId", "title slug")
      .sort({ createdAt: -1 })
      .limit(perPage);

    return res.json(allComments);
  } catch (err) {
    console.log(err);
  }
};

export const userComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postedBy: req.user._id })
      .populate("postedBy", "name")
      .populate("postId", "title slug")
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (err) {
    console.log(err);
  }
};

export const commentCount = async (req, res) => {
  try {
    const count = await Comment.countDocuments();
    res.json(count);
  } catch (err) {
    console.log(err);
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true }
    );
    res.json(updatedComment);
  } catch (err) {
    console.log(err);
  }
};

export const removeComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.commentId);

    // If comment is successfully deleted, update the associated post's commentCount
    if (comment) {
      const post = await Post.findOneAndUpdate(
        { _id: comment.postId },
        { $inc: { commentCount: -1 } },
        { new: true }
      );

      if (!post) {
        console.error("Associated post not found");
      }

      res.json({ ok: true });
    } else {
      // Comment not found
      res.json({ ok: false, error: "Comment not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
};

export const getNumbers = async (req, res) => {
  try {
    const posts = await Post.countDocuments();
    const users = await User.countDocuments();
    const comments = await Comment.countDocuments();
    const categories = await Category.countDocuments();

    return res.json({ posts, users, comments, categories });
  } catch (err) {
    console.log(err);
  }
};

export const createDraft = async (req, res) => {
  try {
    const { title, content, volumes, categories, coverImage } = req.body;

    if (!title || !content || !volumes || !categories || !coverImage) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const alreadyExist = await Draft.findOne({
      slug: slugify(title.toLowerCase()),
    });
    if (alreadyExist) return res.status(400).json({ error: "Title is taken" });

    const categoryIds = await Promise.all(
      categories.map(async (category) => {
        const existingCategory = await Category.findOne({ name: category });
        return existingCategory ? existingCategory._id : null;
      })
    );

    const formattedVolumes = volumes.map((volume) => ({
      volume: volume.volume,
      chapters: volume.chapters.map((chapter) => ({
        chapter: chapter.chapter,
        name: chapter.name,
        content: chapter.content,
      })),
    }));

    const post = await new Draft({
      title,
      content,
      volumes: formattedVolumes,
      categories: categoryIds.filter((categoryId) => categoryId),
      coverImage,
      postedBy: req.user._id,
      slug: slugify(title),
    }).save();

    return res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const editDraft = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, volumes, coverImage, categories } = req.body;

    // Get category ids based on category name
    const categoryIds = await Promise.all(
      categories.map(async (category) => {
        const existingCategory = await Category.findOne({ name: category });
        return existingCategory ? existingCategory._id : null;
      })
    );

    // Adjust the volumes and chapters data
    const formattedVolumes = volumes.map((volume) => ({
      volume: volume.volume,
      chapters: volume.chapters.map((chapter) => ({
        chapter: chapter.chapter,
        name: chapter.name,
        content: chapter.content,
      })),
    }));

    // Update post
    const post = await Draft.findByIdAndUpdate(
      postId,
      {
        title,
        slug: slugify(title),
        volumes: formattedVolumes,
        categories: categoryIds.filter((categoryId) => categoryId),
        coverImage,
      },
      { new: true }
    )
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("coverImage", "url")
      .populate({
        path: "volumes",
        populate: {
          path: "chapters",
          select: "chapter name content",
        },
      });

    res.json(post);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const drafts = async (req, res) => {
  try {
    const all = await Draft.find()
      .populate("coverImage")
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("volumes.chapters", "name content")
      .populate("commentCount")
      .sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const draftPage = async (req, res) => {
  try {
    const perPage = 5;
    const page = req.params.page || 1;

    const all = await Draft.find()
      .skip((page - 1) * perPage)
      .populate("coverImage")
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .sort({ createdAt: -1 })
      .limit(perPage);
    res.json(all);
  } catch (err) {
    console.log(err);
  }
};

export const removeDraft = async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Draft.findByIdAndDelete(postId);
    if (post) {
      res.json({ ok: true });
    } else {
      res.json({ ok: false, error: "Draft not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
};

export const draftsByAuthor = async (req, res) => {
  try {
    const posts = await Draft.find({ postedBy: req.user._id })
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("coverImage", "url")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

export const singleDraft = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Draft.findOne({ slug })
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .populate("coverImage", "url")
      .populate({
        path: "volumes",
        populate: {
          path: "chapters",
          select: "chapter name content",
        },
      });
    const comments = await Comment.find({ postId: post._id })
      .populate("postedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const publishDraftPosts = async (req, res) => {
  try {
    const { postIds } = req.body;
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: "Invalid postIds" });
    }

    const publishedPosts = [];
    for (const postId of postIds) {
      const draft = await Draft.findById(postId);

      if (draft) {
        const { title, content, volumes, categories, coverImage } = draft;

        const post = await new Post({
          title,
          content,
          volumes,
          categories,
          coverImage,
          postedBy: req.user._id,
          slug: slugify(title), 
        }).save();

        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { posts: post._id },
        });

        await Draft.findByIdAndDelete(postId);

        publishedPosts.push(post);
      }
    }

    return res.json({ ok: true, publishedPosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const addToLibrary = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    if (!postId || !userId) {
      return res.status(400).json({ error: "postId and userId are required" });
    }
    const user = await User.findById(userId);
    user.library.push(req.body.postId);
    await user.save();

    res.json({ success: true, message: "Post added to library successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add post to library" });
  }
};

export const getLibrary = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await User.findById(userId).populate({
      path: "library",
      select: "title slug coverImage postedBy createdAt",
      populate: {
        path: "coverImage postedBy",
        select: "url name",
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const libraryWithDetails = user.library.map((post) => ({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      coverImage: post.coverImage ? post.coverImage.url : null,
      postedBy: post.postedBy ? post.postedBy.name : null,
      createdAt: post.createdAt,
    }));    

    res.json({ success: true, library: libraryWithDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get library" });
  }
};

export const hideComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Set the 'hidden' field to true
    comment.hidden = true;

    // Save the updated comment
    await comment.save();

    return res.json({ success: true, message: "Comment hidden successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const allComments = async (req, res) => {
  try {
    const allComments = await Comment.find()
      .populate("postedBy", "name")
      .populate("postId", "title slug")
      .sort({ createdAt: -1 })

    return res.json(allComments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const bulkRemoveFromLibrary = async (req, res) => {
  try {
    const { bookIds } = req.body;

    // Check if bookIds array exists and is not empty
    if (!bookIds || bookIds.length === 0) {
      return res.status(400).json({ error: "No bookIds provided for bulk delete" });
    }

    // Perform bulk delete operation based on bookIds
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { library: { $in: bookIds } } }
    );

    res.json({ success: true, message: "Books removed from library successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to remove books from library" });
  }
};


