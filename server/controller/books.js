const Book = require('../models/bookMods');
const PER_PAGE = 16;

//// should be in admin
// -------------------------------------------------------------------------------------------------------
// add book
exports.getAddNewBook = (req, res, next) => {
    res.render("admin/addBook");
}

exports.postAddNewBook = async(req, res, next) => {
    try {
        const book_info = req.body.book;
        book_info.description = req.sanitize(book_info.description);

        const isDuplicate = await Book.find(book_info);

        if(isDuplicate.length > 0) {
            req.flash("error", "This book is already registered in inventory");
            return res.redirect('back');
        }

        const new_book = new Book(book_info);
        await new_book.save();
        req.flash("success", `A new book named ${new_book.title} is added to the inventory`);
        res.redirect("/admin/bookInventory/all/all/1");
    } catch(err) {
        console.log(err);
        res.redirect('back');
    }
};

// admin -> get the book to be updated
exports.getUpdateBook = async (req, res, next) => {

    try {
        const book_id = req.params.book_id;
        const book = await Book.findById(book_id);

        res.render('admin/book', {
            book: book,
        })
    } catch(err) {
        console.log(err);
        return res.redirect('back');
    }
};

// admin -> post update book
exports.postUpdateBook = async(req, res, next) => {

    try {
        const description = req.sanitize(req.body.book.description);
        const book_info = req.body.book;
        const book_id = req.params.book_id;

        await Book.findByIdAndUpdate(book_id, book_info);

        res.redirect("/admin/bookInventory/all/all/1");
    } catch (err) {
        console.log(err);
        res.redirect('back');
    }
};

// admin -> delete book
exports.getDeleteBook = async(req, res, next) => {
    try {
        const book_id = req.params.book_id;

        const book = await Book.findById(book_id);
        await book.remove();

        req.flash("success", `A book named ${book.title} is just deleted!`);
        res.redirect('back');

    } catch(err) {
        console.log(err);
        res.redirect('back');
    }
};

// -------------------------------------------------------------------------------------------------------

// User Books

//user -> issue a book
exports.postIssueBook = async(req, res, next) => {
    if(req.user.violationFlag) {
        req.flash("error", "You are flagged for violating rules/delay on returning books/paying fines. Untill the flag is lifted, You can't issue any books");
        return res.redirect("back");
    }

    if(req.user.bookIssueInfo.length >= 5) {
        req.flash("warning", "You can't issue more than 5 books at a time");
        return res.redirect("back");
    }

    try {
        const book = await Book.findById(req.params.book_id);
        const user = await User.findById(req.params.user_id);

        // registering issue
        book.stock -= 1;
        const issue =  new Issue({
            book_info: {
                id: book._id,
                title: book.title,
                author: book.author,
                ISBN: book.ISBN,
                category: book.category,
                stock: book.stock,
            },
            user_id: {
                id: user._id,
                username: user.username,
            }
        });

        // putting issue record on individual user document
        user.bookIssueInfo.push(book._id);

        // logging the activity
        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
            },
            category: "Issue",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: user._id,
                username: user.username,
            }
        });

        // await ensure to synchronously save all database alteration
        await issue.save();
        await user.save();
        await book.save();
        await activity.save();

        res.redirect("/books/all/all/1");
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> show return-renew page
exports.getShowRenewReturn = async(req, res, next) => {
    const user_id = req.user._id;
    try {
        const issue = await Issue.find({"user_id.id": user_id});
        res.render("user/return-renew", {user: issue});
    } catch (err) {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> renew book working procedure

exports.postRenewBook = async(req, res, next) => {
    try {
        const searchObj = {
            "user_id.id": req.user._id,
            "book_info.id": req.params.book_id,
        }
        const issue = await Issue.findOne(searchObj);
        // adding extra 7 days to that issue
        let time = issue.book_info.returnDate.getTime();
        issue.book_info.returnDate = time + 7*24*60*60*1000;
        issue.book_info.isRenewed = true;

        // logging the activity
        const activity = new Activity({
            info: {
                id: issue._id,
                title: issue.book_info.title,
            },
            category: "Renew",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: req.user._id,
                username: req.user.username,
            }
        });

        await activity.save();
        await issue.save();

        res.redirect("/books/return-renew");
    } catch (err) {
        console.log(err);
        return res.redirect("back");

    }
}

// user -> return book working procedure

exports.postReturnBook = async(req, res, next) => {
    try {
        // finding the position
        const book_id = req.params.book_id;
        const pos = req.user.bookIssueInfo.indexOf(req.params.book_id);

        // fetching book from db and increament
        const book = await Book.findById(book_id);
        book.stock += 1;
        await book.save();

        // removing issue
        const issue =  await Issue.findOne({"user_id.id": req.user._id});
        await issue.remove();

        // popping book issue info from user
        req.user.bookIssueInfo.splice(pos, 1);
        await req.user.save();

        // logging the activity
        const activity = new Activity({
            info: {
                id: issue.book_info.id,
                title: issue.book_info.title,
            },
            category: "Return",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: req.user._id,
                username: req.user.username,
            }
        });
        await activity.save();

        // redirecting
        res.redirect("/books/return-renew");
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

// -------------------------------------------------------------------------------------------------------

// search books
exports.getBooks = async(req, res, next) => {
    var page = req.params.page || 1;
    const filter = req.params.filter;
    const value = req.params.value;
    let searchObj = {};

    // constructing search object
    if(filter != 'all' && value != 'all') {
        // fetch books by search value and filter
        searchObj[filter] = value;
    }

    try {
        // Fetch books from database
        const books = await Book
            .find(searchObj)
            .skip((PER_PAGE * page) - PER_PAGE)
            .limit(PER_PAGE);

        // Get the count of total available book of given filter
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

exports.findBooks = async(req, res, next) => {

    var page = req.params.page || 1;
    const filter = req.body.filter.toLowerCase();
    const value = req.body.searchName;

    // show flash message if empty search field is sent to backend
    if(value == "") {
        req.flash("error", "Searc field is empty. Please fill the search field in order to get a result");
        return res.redirect('back');
    }

    const searchObj = {};
    searchObj[filter] = value;

    try {
        // Fetch books from database
        const books = await Book
            .find(searchObj)
            .skip((PER_PAGE * page) - PER_PAGE)
            .limit(PER_PAGE)

        // Get the count of total available book of given filter
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

// find book details working procedure
/*
   1. fetch book from db by id
   2. populate book with associated comments
   3. render user/bookDetails template and send the fetched book
*/

exports.getBookDetails = async(req, res, next) => {
    try {
        const book_id = req.params.book_id;
        const book = await Book.findById(book_id).populate("comments");
        res.render("user/bookDetails", {book: book});
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