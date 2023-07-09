const Book = require('../models/book');
const { findOne } = require('../models/bookinstance');
const Genre = require("../models/genre");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require('express-validator')



// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find({})
  .sort({ name: 1})
  .exec()
  console.log(allGenres)
  res.render('genre_list.pug', {
    title: "Genre List",
    genre_list: allGenres
  })
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec()
  ])
  if (genre === null){
    //no results
    const err = new Error("Genre not found")
    err.status = 404
    return next(err)
  }
  console.log(booksInGenre)
  res.render('genre_detail', {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre
  });
});

// Display Genre create form on GET.
exports.genre_create_get = asyncHandler(async (req, res, next) => {
  res.render("genre_form", {title: "Create Genre"})
  
});

// Handle Genre create on POST.
exports.genre_create_post = [
  // validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({min: 3})
    .escape(),
  
  
  // process request after validation and sanitization
  asyncHandler(async(req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req)

    // Create a genre object with escape and trimmed data
    const genre = new Genre({
      name: req.body.name
    })

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data form is valid.
      // CHeck if Genre with same name already exists.
      const genreExists = await findOne({ name: req.body.name}).exec();
      if (genreExists){
        res.redirect(genreExists.url)
      } else {
        await genre.save();
        // new genre saved. redirect to genre detail page
        res.redirect(genre.url)
      }
    }

  })
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, allBooksByGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id} ).exec()
  ])

  
  if (genre === null){
    // No results
    res.redirect("/catalog/genres")
  }

  res.render("genre_delete.pug", {
    title: "Genre Delete",
    genre: genre,
    genre_books: allBooksByGenre
  })
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [genre, allBooksByGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ])
  
  if (allBooksByGenre.length > 0){
      // Books contain genre and genre cannot be deleted until books that use the genre are deleted first.
      res.render("genre_delete", {
        title: "Genre Delete",
        genre: genre,
        genre_books: allBooksByGenre
      });
      return;
  } else {
      await Genre.findByIdAndRemove(req.body.genreid)
      res.redirect('/catalog/genres')
    }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {

  const genre = await Genre.findById(req.params.id).exec()

  res.render("genre_form", {
    title: "Update Genre",
    genre: genre,
  })

});

// Handle Genre update on POST.
exports.genre_update_post = [
  
  // validate and sanitize fields
  body("name", "Genre must contain atleast 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  asyncHandler(async(req, res, next) => {

    const errors = validationResult(req)

    const updated_genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    })

    if (!errors.isEmpty()){
      // there are errors. render like GET request with sanitized and validated fields
      res.render("genre_form", {
        title: "Update Genre",
        genre: updated_genre
      })
      return;
    } else {
        const updatedgenre = await Genre.findByIdAndUpdate(req.params.id, updated_genre, {})

        // redirect to genre detail
        res.redirect(updatedgenre.url)
    }

  })
]