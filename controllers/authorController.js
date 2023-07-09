const author = require('../models/author')
const Author = require('../models/author')
const Book = require('../models/book')
const asyncHandler = require('express-async-handler')
const { body, validationResult } = require('express-validator')
const debug = require('debug')('author')

exports.author_list = asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.find({})
        .sort({ family_name: 1})
        .exec()
    console.log(allAuthors)
    res.render("author_list", { 
        title: "List of Authors",
        author_list: allAuthors
    })
})

exports.author_detail = asyncHandler(async (req, res, next) => {
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec()
    ])
    if (author === null){
        const err = new Error("Author not found")
        err.status = 404
        return next(err)
    }
    console.log(author, allBooksByAuthor)

    res.render("author_detail", {
        title: "Author Detail",
        author: author,
        author_books: allBooksByAuthor
    })
})

// Handle AUthor create form on GET
exports.author_create_get = asyncHandler(async (req, res, next) => {
    res.render("author_form", {title: "Author Create"})
})

// Handle author create on POST
exports.author_create_post = [
    // Validate and sanitize fields
    body("first_name")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage('First name must be specified')
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({ min: 1})
        .escape()
        .withMessage("Family name must be specified")
        .isAlphanumeric()
        .withMessage("Family has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy"})
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid Date of Death")
        .optional({ values: "falsy"})
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization
    asyncHandler(async(req, res, next) => {
        // Extract validation errors from a request
        const errors = validationResult(req)

        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        });

        if (!errors.isEmpty()){
            // There are errors. render form again with sanitized values/error messages
            res.render("author_form", {
                title: "Create Author",
                author: author,
                errors: errors.array()
            })
            return;
        } else {
            // Data form is valid
            
            await author.save()
            res.redirect(author.url)
        }
    })
]

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
      // Get details of author and all their books (in parallel)

    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ])
    if (author === null){
        // no results
        res.redirect("/catalog/authors")
    }
    
    res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor
    })
})

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async(req, res, next)  => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec()
    ])
    
    if (allBooksByAuthor.length > 0){
        // Author has books. Render in same way as for GET route.
        res.render('author_delete', {
            title: 'Delete Author',
            author: author,
            author_books: allBooksByAuthor,
        });
        return;
    } else {
        // AUthor has no Books. Delete Object and redirect to the list of authors.
        await Author.findByIdAndRemove(req.body.authorid)
        res.redirect("/catalog/authors")
    }
})

exports.author_update_get = asyncHandler(async(req, res, next) => {
    const author = await Author.findById(req.params.id).exec()

    console.log(author)

    if (author === null) {
        // no results
        debug(`id not found on update: ${req.params.id}`)
        const err = new Error("Author not found")
        err.status = 404;
        return next(err)
    }

    res.render("author_form", {
        title: "Update Author",
        author: author
    })

})

// Handle book update on POST
exports.author_update_post = [
    
    // validate and sanitize fields
    body("first_name")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage("First name must be specified")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage("Family name must be specified")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric character"),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: 'falsy'})
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: 'falsy'})
        .isISO8601()
        .toDate(),
    
    // process request after validation and sanitization
    asyncHandler(async(req, res, next) => {
        
        const errors = validationResult(req)

        // Create new author

        const new_author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        })
        
        if (!errors.isEmpty()){
            // there are errors. render form again with sanitized valres.
          res.render({
            title: "Update Author",
            author: new_author,
            errors: errors.array()
          })
          return;
        } else {
            const newAuthor = await Author.findByIdAndUpdate(req.params.id, new_author, {})

            //redirect to author detail page
            res.redirect(new_author.url)
        }
    })


]