const Book = require('../models/bookMods');
const PER_PAGE = 16;

exports.getAddNewBook = (req, res, next) => {
    res.render("/addBook");
}

exports.postAddNewBook = async(req, res, next) => {
    try {
        const book_info = req.body.book;
        book_info.description = req.sanitize(book_info.description);

        const new_book = new Book(book_info);
        await new_book.save();
        res.status(202).json({'success':`A new book named ${new_book.title} is added to the inventory`});
        res.redirect("/bookInventory/all/all/1");
    } catch(err) {
        console.log(err);
        res.redirect('back');
    }
};


exports.getUpdateBook = async (req, res, next) => {

    try {
        const book_id = req.params.book_id;
        const book = await Book.findById(book_id);

        res.render('/book', {
            book: book,
        })
    } catch(err) {
        console.log(err);
        return res.redirect('back');
    }
};


exports.postUpdateBook = async(req, res, next) => {

    try {

        const book_info = req.body.book;
        const book_id = req.params.book_id;

        await Book.findByIdAndUpdate(book_id, book_info);

        res.redirect("/bookInventory/all/all/1");
    } catch (err) {
        console.log(err);
        res.redirect('back');
    }
};


exports.getDeleteBook = async(req, res, next) => {
    try {
        const book_id = req.params.book_id;

        const book = await Book.findById(book_id);
        await book.remove();

        res.status(200).json({'success' :`A new book named ${book.title} is just deleted`});

        res.redirect('back');

    } catch(err) {
        console.log(err);
        res.redirect('back');
    }
};


exports.getBooks = async(req, res, next) => {
    var page = req.params.page || 1;
    const filter = req.params.filter;
    const value = req.params.value;
    let searchObj = {};


    if(filter != 'all' && value != 'all') {

        searchObj[filter] = value;
    }

    try {

        const books = await Book
            .find(searchObj)
            .skip((PER_PAGE * page) - PER_PAGE)
            .limit(PER_PAGE);


        const count = await Book.find(searchObj).countDocuments();

        res.render("books", {
            books: books,
            current: page,
            pages: Math.ceil(count / PER_PAGE), // amount of books available on page
            filter: filter,
            value: value,
            user: req.user,
        })
    } catch(err) {
        console.log(err)
    }
}

exports.findBooks = async(req, res, next) => {

    var page = req.params.page || 1;
    const filter = req.body.filter.toLowerCase();
    const value = req.body.searchName;


    if(value == "") {

        res.status(400).json({error :`Search field is empty. Please fill the search field in order to get a result`});
        return res.redirect('back');
    }

    const searchObj = {};
    searchObj[filter] = value;

    try {

        const books = await Book
            .find(searchObj)
            .skip((PER_PAGE * page) - PER_PAGE)
            .limit(PER_PAGE)


        const count = await Book.find(searchObj).countDocuments();

        res.render("books", {
            books: books,
            current: page,
            pages: Math.ceil(count / PER_PAGE),
            filter: filter,
            value: value,
            user: req.user,
        })
    } catch(err) {
        console.log(err)
    }
}


exports.getBookDetails = async(req, res, next) => {
    try {
        const book_id = req.params.book_id;
        const book = await Book.findById(book_id).populate("comments");
        res.render("/bookDetails", {book: book});
    } catch (err) {
        console.log(err);
        return res.redirect("back");
    }
}

exports.deleteBook = async (req, res, next) => {
    try {

        var page = req.params.page || 1;
        const filter = req.body.filter.toLow
        const value = req.body.searchName;

        const searchObj = {};
        searchObj[filter] = value;

        const book_id = req.params.book_id;
        const toDelete = await book.delete(book_id);

        res.render("books", {
            books: books,
            current: page,
            pages: Math.ceil(count / PER_PAGE),
            filter: filter,
            value: value,
            user: req.user,
        })

    } catch (err) {
        console.log(err);
        return res.redirect('back');
    }
}