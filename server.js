const path = require("node:path");
const { randomBytes, createHmac } = require("node:crypto");
const jwt = require("jsonwebtoken");
const SECRETKEY = require("./config").SECRETKEY;
const fs = require('node:fs'); 
const {pipeline} = require('node:stream/promises');

const fastify = require('fastify')({ logger: true });
const { ObjectId } = require("@fastify/mongodb");

const auth = require("./auth-hook");
const oth = require("./on-Hook")

fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "public"),
    prefix: "/"
})

fastify.register(require("@fastify/cookie"), { hook: "onRequest" });
fastify.register(require('@fastify/multipart'));
fastify.register(require('@fastify/formbody'));

fastify.register(require("@fastify/view"), {
    engine: {
        pug: require("pug")
    },
    root: "./view",
    propertyName: "render",
})

fastify.register(require("@fastify/mongodb"), {
    forceClose: true,
    url: "mongodb://localhost:27017/demo"
})

fastify.get('/', {onRequest: auth}, async function (req, rep) {
    /*const books = await this.mongo.db.collection("books").find({}).toArray();*/

    const readingBooks = await this.mongo.db.collection("books").find({ status: "Đang đọc" })
                                                                .sort({ startDay: -1 })
                                                                .limit(8)
                                                                .toArray();

  // 2. Lấy sách mới thêm gần đây
  const latestBooks = await this.mongo.db.collection("books").find()
                                                             .sort({ _id: -1 })
                                                             .limit(8)
                                                             .toArray();

  // 3. Lấy sách ngẫu nhiên
  const randomBooks = await this.mongo.db.collection("books").aggregate([{ $sample: { size: 20 } }])
                                                             .toArray();

  const totalBooks = await this.mongo.db.collection("books").countDocuments({});
  const novelCount = await this.mongo.db.collection("books").countDocuments({ genres: /Novel/i });
  const comicCount = await this.mongo.db.collection("books").countDocuments({ genres: /Comic|Manga/i });
  const techCount = await this.mongo.db.collection("books").countDocuments({ genres: /Technology|Tech/i });                                                           

  // Render ra trang home
  return rep.render("home.pug", {readingBooks,latestBooks,randomBooks,totalBooks,novelCount,comicCount,techCount});
})

fastify.get('/header', async function (req, rep) {
    return rep.render('header.pug');
})

fastify.get("/users", {onRequest: [auth, oth('admin')]}, async function (req, rep) {
    const users = await this.mongo.db.collection("users").find({}).toArray();
    return rep.redirect("/settings")
})

fastify.get("/delete-user/:id", {onRequest: [auth, oth('admin')]}, async function (req, rep) {
    const result = await this.mongo.db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
    rep.redirect("/settings");
})

fastify.get("/update-user/:id", {onRequest: [auth, oth('admin')]}, async function (req, rep) {
    const user = await this.mongo.db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
    return rep.render("update-user", { user });
})

fastify.post("/update-user/:id", {onRequest: [auth, oth('admin')]}, async function (req, rep) {
    await this.mongo.db.collection("users").updateOne(
        { _id: new ObjectId(req.params.id) },
        {
            $set: {
                username: req.body.username,
                fullname: req.body.fullname,
                password: req.body.password,
                role: req.body.role
            }
        }
    );
    rep.redirect("/users");
})

fastify.post("/user", {onRequest: [auth, oth('admin')]}, async function (req, rep) {
    //Validation
    // const { username, fullname, role } = req.body;
    const salt = randomBytes(16).toString('hex');
    const hmac = createHmac("sha256", salt);
    const hpass = hmac.update(req.body.password).digest("hex");
    await this.mongo.db.collection("users").insertOne({
        username: req.body.username,
        fullname: req.body.fullname,
        role: req.body.role,
        password: req.body.password,
        salt,
        hpass
    })

    rep.redirect("/users");
})

fastify.get("/create-user", {onRequest: [auth, oth('admin')]}, function (req, rep) {
    rep.render('create-user.pug')
})

fastify.get("/create-book", {onRequest: auth},function (req, rep) {
    rep.render('create-book.pug')
})

fastify.post("/create-book", {onRequest: auth}, async function (req, rep) {
  try {
    let imagePath = "/img/default-cover.jpg"; // ảnh mặc định
    const fields = {}; // chứa text field

    // Duyệt qua tất cả phần dữ liệu (text + file)
    for await (const part of req.parts()) {
      if (part.file) {
        // Nếu người dùng upload ảnh
        const filename = Date.now() + "-" + part.filename.replace(/\s+/g, "_");
        const dirPath = "./public/img/book_img/";
        fs.mkdirSync(dirPath, { recursive: true });

        const filePath = path.join(dirPath, filename);
        await pipeline(part.file, fs.createWriteStream(filePath));

        imagePath = "/img/book_img/" + filename;
      } else {
        // Nếu là input text
        fields[part.fieldname] = part.value?.trim() || "";
      }
    }

    // Tạo object sách
    const book = {
      image: imagePath,
      title: fields.title || "Chưa đặt tên",
      author: fields.author || "Không rõ",
      genres: fields.genres || "",
      publisher: fields.publisher || "",
      language: fields.language || "",
      page: Number(fields.page) || 0,
      status: fields.status || "Chưa đọc",
      startDay: fields.startDay || "",
      endDay: fields.endDay || "",
      description: fields.description || "",
      createdAt: new Date(),
    };

    // Thêm vào MongoDB
    await this.mongo.db.collection("books").insertOne(book);

    fastify.log.info(`✅ Đã thêm sách mới: ${book.title}`);
    return rep.redirect("/books");
  } catch (err) {
    fastify.log.error(err);
    return rep.status(500).send("Lỗi khi thêm sách!");
  }
});

fastify.get("/books", {onRequest: auth}, async function (req, rep) {
    const books = await this.mongo.db.collection("books").find({}).toArray();
    return rep.render('books', { books});
})

fastify.get("/delete-book/:id", async function (req, rep) {
    const result = await this.mongo.db.collection("books").deleteOne({ _id: new ObjectId(req.params.id) });
    rep.redirect("/books");
})

fastify.get('/update-book/:id', {onRequest: auth}, async function (req, rep) {
    const book = await this.mongo.db.collection("books").findOne({ _id: new ObjectId(req.params.id) });
    return rep.render("update-book", { book });
});

fastify.post('/update-book/:id', {onRequest: auth}, async function (req, rep) {
  const oldBook = await this.mongo.db.collection("books").findOne({_id: new ObjectId(req.params.id)});

  let imagePath = oldBook.image; // giữ lại ảnh cũ
  const fields = {}; // chứa các field text

  // Duyệt qua từng phần (file hoặc field)
  for await (const part of req.parts()) {
    if (part.file) {
      // Nếu có upload ảnh mới
      const filename = Date.now() + "-" + part.filename.replace(/\s+/g, "_");
      const dirPath = "./public/img/book_img/";
      const filePath = dirPath + filename;

      fs.mkdirSync(dirPath, { recursive: true });
      await pipeline(part.file, fs.createWriteStream(filePath));

      // Xóa ảnh cũ nếu có
      if (oldBook.image) {
        const oldPath = path.join("./public", oldBook.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      imagePath = "/img/book_img/" + filename;
    } else {
      // Nếu là input text
      fields[part.fieldname] = part.value;
    }
  }

  // Cập nhật dữ liệu (nếu có thay đổi, nếu không thì giữ nguyên)
    const updateBook = {
      image: imagePath,
      title: fields.title || oldBook.title,
      author: fields.author || oldBook.author,
      genres: fields.genres || oldBook.genres,
      publisher: fields.publisher || oldBook.publisher,
      language: fields.language || oldBook.language,
      page: fields.page || oldBook.page,
      status: fields.status || oldBook.status,
      startDay: fields.startDay || oldBook.startDay,
      endDay: fields.endDay || oldBook.endDay,
      description: fields.description || oldBook.description,
      updatedAt: Date.now(),
    };

  await this.mongo.db.collection("books").updateOne({ _id: new ObjectId(req.params.id) },{ $set: updateBook });
  return rep.redirect(`/book/${req.params.id}`);
});


fastify.get("/book/:id", {onRequest: auth}, async function (req, rep) {
    const book = await this.mongo.db.collection("books").findOne({ _id: new ObjectId(req.params.id) });
    return rep.render("book-detail", {book});
})

fastify.post("/book/:id/add-note", {onRequest: auth}, async function (req, rep) {
  const { title, content } = req.body;
  const note = {
    _id: new ObjectId(),
    title,
    content,
    createdAt: new Date()
  };
  await this.mongo.db.collection("books").updateOne({_id: new ObjectId(req.params.id) },{$push: { notes: note }});
  rep.redirect(`/book/${req.params.id}`);
});

fastify.get("/book/:bookId/edit-note/:noteId", {onRequest: auth}, async function (req, rep) {
  const { bookId, noteId } = req.params;
  const book = await this.mongo.db.collection("books").findOne({ _id: new ObjectId(bookId)});
  const note = book.notes?.find(n => n._id.toString() === noteId);
  return rep.send({ note });
});


fastify.post("/book/:bookId/edit-note", {onRequest: auth}, async function (req, rep) {
  const { bookId } = req.params;
  const { noteId, title, content } = req.body;

  await this.mongo.db.collection("books").updateOne({_id: new ObjectId(bookId), "notes._id": new ObjectId(noteId) },
    {$set: { "notes.$.title": title, "notes.$.content": content, "notes.$.updatedAt": new Date() } }
  );

  rep.redirect(`/book/${bookId}`);
});

fastify.get("/book/:bookId/delete-note/:noteId", {onRequest: auth}, async function (req, rep) {
  await this.mongo.db.collection("books").updateOne({_id: new ObjectId(req.params.bookId) },{$pull: { notes: { _id: new ObjectId(req.params.noteId)}}});

  rep.redirect(`/book/${req.params.bookId}`);
});

fastify.get("/search",{onRequest: auth}, async function (req, rep) {
  const searchQuery = req.query.searchQuery.trim();
  let books = [];

  if (searchQuery && searchQuery.length > 0) {
    // tạo regex không phân biệt hoa thường
    const regex = new RegExp(searchQuery, "i");
    books = await this.mongo.db.collection("books").find({
        $or: [
          { title: regex },
          { author: regex },
          { genres: regex },
          { publisher: regex }
        ]
      }).toArray();
  } else {
    books = await this.mongo.db.collection("books").find().toArray();
  }
  return rep.render("books", { books, searchQuery });
});

fastify.get("/books/novel",{onRequest: auth}, async function (req, rep){
    const books = await this.mongo.db.collection("books").find({ genres: /Novel/i }).toArray();
    return rep.render("books-novel.pug", {books});
});
fastify.get("/books/comic&manga", {onRequest: auth}, async function (req, rep){
    const books = await this.mongo.db.collection("books").find({
      $or: [
         {genres: /Comic/i},
         {genres: /Manga/i}
      ] 
    }).toArray();
  return rep.render("books-comic&manga.pug", {books});
});
fastify.get("/books/technology", {onRequest: auth}, async function (req, rep){
    const books = await this.mongo.db.collection("books").find({ genres: /Technology/i }).toArray();
    return rep.render("books-technology.pug", {books});
});

fastify.addHook("preHandler", async function (req, rep){
  rep.locals = {
    totalBooks: await this.mongo.db.collection("books").countDocuments({}),
    novelCount: await this.mongo.db.collection("books").countDocuments({ genres: /Novel/i }),
    comicCount: await this.mongo.db.collection("books").countDocuments({ genres: /Comic|Manga/i }),
    techCount: await this.mongo.db.collection("books").countDocuments({ genres: /Technology|Tech/i })
  };
});

fastify.get("/login", async function (req, rep) {
    return rep.render("login")
})

fastify.post("/login", async function (req, rep) {
    const user = await this.mongo.db.collection("users").findOne({ username: req.body.username });
    if (user) {
        const newHpass = createHmac("sha256", user.salt).update(req.body.password).digest("hex");
        if (newHpass === user.hpass) {
            const token = jwt.sign({ username: user.username, role: user.role }, SECRETKEY);
            rep.cookie('token', token);

            return rep.redirect("/");
        } else {
            return rep.send("Sai password");
        }
    } else {
        return rep.send(`${req.body.username} khong ton tai trong db`);
    }
})

fastify.get("/logout", async function (req, rep) {
  rep
    .clearCookie("token", { path: "/" }) 
    .redirect("/login");
});

fastify.get("/register", async (req, rep) => {
  return rep.render("register.pug");
});

fastify.post("/register", async function (req, rep) {
  const { username, fullname, password } = req.body;

  const exist = await this.mongo.db.collection("users").findOne({ username });
  if (exist) return rep.code(400).send("Tên đăng nhập đã tồn tại!");

  const salt = randomBytes(16).toString("hex");
  const hmac = createHmac("sha256", salt);
  const hpass = hmac.update(password).digest("hex");

  await this.mongo.db.collection("users").insertOne({
    username,
    fullname,
    password,
    role: "student",
    salt,
    hpass
  });

  return rep.redirect("/login");
});

fastify.get("/settings",{onRequest: [auth, oth('admin')]}, async function(req, rep){
  const users = await this.mongo.db.collection("users").find().toArray();
  const books = await this.mongo.db.collection("books").find().toArray()

  const totalBooks = books.length;
  const readingCount = books.filter(b => b.status?.toLowerCase() === "đang đọc").length;
  const completedCount = books.filter(b => b.status?.toLowerCase() === "đã hoàn thành").length;
  const genresList = [...new Set(books.map(b => b.genres).filter(Boolean))];
  const genresCount = genresList.length;

  return rep.render("settings.pug",{users, books, search, totalBooks, readingCount, completedCount, genresCount});
});


// Run the server!
fastify.listen({ port: 3000 }, (err) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
})