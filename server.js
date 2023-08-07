const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
require("dotenv").config();
require("./config/dBconnect");
const bcrypt = require("bcrypt");
const app = express();
const { truncatePost } = require('./utils/helpers');
const methodOverride = require('method-override');
app.locals.truncatePost = truncatePost;
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
//serve static files 
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(express.json()); //pass incoming data
app.use(session({
    secret: 'asdhasd',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://srijanpratihar19:srk@cluster0.ao5sugn.mongodb.net/',
        ttl: 24 * 60 * 60,
    }),

}))


const User = require('./models/user/User');
const Post = require('./models/post/Post');
const Comment = require('./models/comment/Comment');

const storage = require('./config/cloudinary');
const multer = require('multer');
//instance of multer
const upload = multer({ storage });
//middlewares
const protected = (req, res, next) => {
    console.log("session id in protected is");
    console.log(req.session.userAuth);
    if (req.session.userAuth) {
        //console.log("hello");
        return next();
    } else {
        //console.log("bye");
        return res.render('notAuthorize.ejs');
    }
};

app.use((req, res, next) => {
    if (req.session.userAuth) {
        res.locals.userAuth = req.session.userAuth;
    } else {
        res.locals.userAuth = null;
    }
    next();
})

//-------
//users route
//------
//POST/api/v1/users/register
app.get('/', async(req, res) => {
    try {
        const posts = await Post.find().populate("user");
        res.render("index.ejs", { posts });
    } catch (error) {
        res.render('index', { error: 'error' })
    }

})
app.get('/api/v1/users/register', (req, res) => {
    try {
        res.render('register.ejs', {
            error: ''
        });
    } catch (error) {
        res.render('index', { error: 'error' })
    }

})
app.get('/api/v1/users/login', (req, res) => {
    try {
        res.render('login.ejs', { error: '' });
    } catch (error) {
        res.render('index', { error: 'error' })
    }

})

app.get('/api/v1/users/upload-profile-photo-form', (req, res) => {
    try {
        res.render('uploadprofilephoto.ejs', { error: '' });
    } catch (error) {
        res.render('index', { error: 'error' })
    }

})

app.get('/api/v1/users/upload-cover-photo-form', (req, res) => {
    try {
        res.render('uploadcoverphoto.ejs', { error: '' });
    } catch (error) {
        res.render('index', { error: 'error' })
    }

})

app.get('/api/v1/users/get-post-form', (req, res) => {
    try {
        res.render('addPost.ejs', { error: "" });
    } catch (error) {
        res.render('index', { error: 'error' })
    }

})

app.post("/api/v1/users/register", async(req, res) => {
    const { fullname, email, password, role, about } = req.body;
    if (!fullname || !email || !password) {
        return res.render('register.ejs', {
            error: "all fields are required"
        });
    }
    try {
        //check if user exist
        const userFound = await User.findOne({ email });


        //throw error
        if (userFound) {
            return res.render('register.ejs', {
                error: "User already exists"
            });
        }
        //Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordhash = await bcrypt.hash(password, salt);

        //register user
        const user = await User.create({ fullname, email, password: passwordhash, role, about });
        //redirect 
        res.redirect('/api/v1/users/login')
    } catch (error) {
        res.json(error);
    }
});

//POST/api/v1/users/login
app.post("/api/v1/users/login", async(req, res) => {
    //console.log(req.session);
    const { email, password } = req.body
    try {
        const userFound = await User.findOne({ email });
        if (!userFound) {
            return res.render('login.ejs', { error: "invalid email" });
        }
        const isPasswordValid = await bcrypt.compare(password, userFound.password);
        if (!isPasswordValid) {
            return res.render('login.ejs', { error: "invalid password" });
        }
        //save the user into session
        console.log(userFound._id);
        req.session.userAuth = userFound._id;
        console.log("session id is");
        console.log(req.session.userAuth);
        return res.redirect('/api/v1/users/profile-page');
    } catch (error) {
        res.json(error);
    }
});

//GET/api/v1/users/:id


//GET/api/v1/users/profile/:id
app.get("/api/v1/users/profile-page", protected, async(req, res) => {
    try {
        const userID = req.session.userAuth;
        const user = await User.findById(userID).populate('posts').populate('comments');
        res.render('profile.ejs', { user });
    } catch (error) {
        res.json(error);
    }
});

app.get("/api/v1/users/logout", async(req, res) => {
    try {
        //destroy session
        req.session.destroy(() => {
            res.redirect('/api/v1/users/login');
        })
    } catch (error) {
        res.json(error);
    }
});

app.put("/api/v1/users/profile-photo-upload/", protected, upload.single('profile'), async(req, res) => {

    try {
        //check if file exist
        if (!req.file) {
            return res.render('uploadprofilephoto.ejs', { error: 'upload valid image' })
        }
        //1.find the user to be updated
        const userId = req.session.userAuth;
        const userFound = await User.findById(userId);
        //2.check if user is found
        if (!userFound) {
            return res.render('uploadprofilephoto.ejs', { error: 'User not found' })
        }
        const userUpdated = await User.findByIdAndUpdate(
            userId, {
                profileImage: req.file.path
            }, {
                new: true,
            }
        );
        res.redirect('/api/v1/users/profile-page');
    } catch (error) {
        return res.json(error);
    }
});





//PUT/api/v1/users/profile-photo-upload/:id


//PUT/api/v1/users/profile-photo-upload/:id
app.put("/api/v1/users/cover-photo-upload/", protected, upload.single('profile'), async(req, res) => {
    try {
        //1.find the user to be updated
        //check if file exist
        if (!req.file) {
            return res.render('uploadcoverphoto.ejs', { error: 'upload valid image' })
        }
        const userId = req.session.userAuth;
        const userFound = await User.findById(userId);
        //2.check if user is found
        if (!userFound) {
            return res.render('uploadcoverphoto.ejs', { error: 'User not found' })
        }
        const userUpdated = await User.findByIdAndUpdate(
            userId, {
                coverImage: req.file.path
            }, {
                new: true,
            }
        );
        res.redirect('/api/v1/users/profile-page');
    } catch (error) {
        return res.json(error);
    }
});


app.get("/api/v1/users/update-password", async(req, res) => {
    try {
        res.render('updatePassword.ejs', { error: '' });
    } catch (error) {
        res.json(error);
    }
});

app.put("/api/v1/users/update-password/", async(req, res) => {
    const { password } = req.body;
    try {
        //check if user is updating the passsword
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHashed = await bcrypt.hash(password, salt);
            await User.findByIdAndUpdate(req.session.userAuth, {
                password: passwordHashed,
            }, {
                new: true,
            });
            res.redirect('/api/v1/users/profile-page');
        } else {
            return res.render('updatePassword.ejs', { error: 'please enter valid password' });
        }
    } catch (error) {
        return res.json(error);
    }
});

app.put("/api/v1/users/update", async(req, res) => {

    const { fullname, email, role, about } = req.body;
    console.log(req.body.fullname);
    const usercurr = await User.findById(req.session.userAuth);
    try {
        if (email) {
            const emailTaken = await User.findOne({ email });
            if (emailTaken && emailTaken._id != req.session.userAuth) {
                return res.render('updateuser.ejs', { user: usercurr, error: 'this email is already taken' });
            }
        }
        const user = await User.findByIdAndUpdate(req.session.userAuth, {
            fullname,
            email,
            role,
            about
        }, {
            new: true,
        })
        res.redirect('/api/v1/users/profile-page');
    } catch (error) {
        return res.json(error);
    }
});


app.get("/api/v1/users/:id", protected, async(req, res) => {
    try {
        //get user id from params
        const userId = req.params.id;
        //find the user
        const user = await User.findById(userId);
        res.render('updateuser.ejs', { user, error: '' });
    } catch (error) {
        res.json(error);
    }
});

app.delete("/api/v1/users/:id", protected, async(req, res) => {
    try {
        //find the post
        const user = await User.findById(req.params.id);
        user.comments.forEach(async(comment) => {
            await Comment.findByIdAndDelete(comment._id.toString());
        })
        user.posts.forEach(async(post) => {
            await Post.findByIdAndDelete(post._id.toString());
        })
        await User.findByIdAndDelete(req.params.id);
        req.session.destroy(() => {
            res.redirect('/');
        })
    } catch (error) {
        res.json(error);
    }
});


//-------
//posts route
//------
//POST/api/v1/posts
app.post("/api/v1/users/posts", protected, upload.single('file'), async(req, res) => {
    const { title, description, category, user } = req.body;
    try {
        if (!title || !description || !category || !req.file) {
            return res.render("addPost.ejs", { error: 'All fields are required' });
        }
        //find the user
        const userId = req.session.userAuth;
        console.log(userId);
        const userFound = await User.findById(userId);
        //create post
        const postCreated = await Post.create({
            title,
            description,
            category,
            user: userFound._id,
            image: req.file.path,
        })

        //push the post created into the array of users post
        userFound.posts.push(postCreated._id);
        //resave the user
        await userFound.save();
        res.redirect('/');
    } catch (error) {
        res.json(error);
    }
});

//GET/api/v1/posts
app.get("/api/v1/posts", async(req, res) => {
    try {
        const posts = await Post.find().populate('comments').populate("user");
        res.json({
            status: "success",
            user: posts,
        });
    } catch (error) {
        res.json(error);
    }
});

//GET/api/v1/posts/:id
app.get("/api/v1/posts/:id", async(req, res) => {
    try {
        //get id from params
        const id = req.params.id;
        const post = await Post.findById(id).populate({ path: 'comments', populate: { path: 'user' } }).populate('user');
        res.render('postDetails', { post, error: '' });
    } catch (error) {
        res.json(error);
    }
});

app.get('/api/v1/get-form-update/:id', async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.render('updatePost.ejs', { post, error: "" });
    } catch (error) {
        res.render('updatePost.ejs', { error, post: "" });
    }

})

//DELETE/api/v1/posts/:id
app.delete("/api/v1/posts/:id", protected, async(req, res) => {
    try {
        //find the post
        const post = await Post.findById(req.params.id);

        //check if post belongs to user

        if (post.user.toString() !== req.session.userAuth.toString()) {
            res.render('postDetails.ejs', { error: "You are not Authorized to delete this post", post });
        }
        //delete post 
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (error) {
        res.json(error);
    }
});

//PUT/api/v1/posts/:id
app.put("/api/v1/posts/:id", protected, upload.single('file'), async(req, res) => {
    //destructure the post
    const { title, description, category } = req.body;
    try {
        //find the post
        const post = await Post.findById(req.params.id);

        //check if post belongs to user

        if (post.user.toString() !== req.session.userAuth.toString()) {
            return res.json({ status: 'failed', user: 'not allowed to update' });
        }
        //check if user is updating image 
        if (req.file) {
            const postUpdated = await Post.findByIdAndUpdate(req.params.id, {
                title,
                description,
                category,
                image: req.file.path
            }, {
                new: true
            });
        } else {
            const postUpdated = await Post.findByIdAndUpdate(req.params.id, {
                title,
                description,
                category,
            }, {
                new: true
            });

        }
        //update

        res.redirect('/api/v1/users/profile-page');
    } catch (error) {
        res.json(error);
    }
});
//-------
//comments
//------
//POST/api/v1/comments
app.post("/api/v1/comments/:id", protected, async(req, res) => {
    const { message } = req.body;
    const id = req.params.id;
    try {
        //find the post
        const post = await Post.findById(req.params.id);
        console.log(post);
        const comment = await Comment.create({
                user: req.session.userAuth,
                message,
                post: post._id,
            })
            //push the comment to post
        post.comments.push(comment._id);

        //find the user
        const user = await User.findById(req.session.userAuth);
        user.comments.push(comment._id);
        //disable validation
        //save
        await post.save({ validateBeforeSave: false });
        await user.save({ validateBeforeSave: false });
        res.redirect(`/api/v1/posts/${id}`)
    } catch (error) {
        res.json(error);
    }
});

//GET/api/v1/comments/:id
app.get("/api/v1/comments/:id", async(req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        res.render('updateComment.ejs', { comment, error: "" });
    } catch (error) {
        res.json(error);
    }
});

//DELETE/api/v1/comments/:id
app.delete("/api/v1/comments/:id", protected, async(req, res) => {
    console.log(req.query);
    try {
        //find the post
        const comment = await Comment.findById(req.params.id);

        //check if post belongs to user

        if (comment.user.toString() !== req.session.userAuth.toString()) {
            return res.json({ status: 'failed', user: 'not allowed to delete' });
        }
        //delete post 
        const deletedPost = await Comment.findByIdAndDelete(req.params.id);
        res.redirect(`/api/v1/posts/${req.query.postId}`);
    } catch (error) {
        res.json(error);
    }
});

//PUT/api/v1/comments/:id
app.put("/api/v1/comments/:id", protected, async(req, res) => {
    console.log(req.body.message);
    try {
        //find the comment
        const comment = await Comment.findById(req.params.id);

        //check if post belongs to user

        if (comment.user.toString() !== req.session.userAuth.toString()) {
            return res.json({ status: 'failed', user: 'not allowed to update' });
        }

        //update
        const commentUpdated = await Comment.findByIdAndUpdate(req.params.id, {
            message: req.body.message
        }, {
            new: true
        });
        return res.redirect(`/api/v1/posts/${req.query.postId}`);
    } catch (error) {
        res.json(error);
    }
});

//Error handler middlewares
//listen server
const PORT = process.env.PORT || 9000;
app.listen(PORT, console.log(`Servver is running on PORT ${PORT}`));