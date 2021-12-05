const express = require("express"),
    router = express.Router();


// importing controller
const adminController = require('../controllers/admin');


//admin -> add new book
router.get("/admin/books/add", adminController.getAddNewBook);

router.post("/admin/books/add", adminController.postAddNewBook);


//admin -> update book
router.post("/admin/book/update/:book_id", adminController.postUpdateBook);

//admin -> delete book
router.get("/admin/book/delete/:book_id", adminController.getDeleteBook);

