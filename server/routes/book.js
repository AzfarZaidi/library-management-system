const express = require("express"),
    router = express.Router();

// default for books

// Importing controller
const bookController = require('../controller/books');
// importing controller
const adminController = require('../controllers/admin');

// Browse books
router.get("/:filter/:value/:page", bookController.getBooks);

// Fetch books by search value
router.post("/:filter/:value/:page", bookController.findBooks);

// Fetch individual book details
router.get("/details/:book_id", bookController.getBookDetails);


//admin -> add new book
router.get("/add", adminController.getAddNewBook);

router.post("/add", adminController.postAddNewBook);


//admin -> update book
router.post("update/:book_id", adminController.postUpdateBook);

//admin -> delete book
router.get("delete/:book_id", adminController.getDeleteBook);



module.exports = router;