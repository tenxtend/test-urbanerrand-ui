const router = require('express').Router();
const Gig = require('../models/gig');
const User = require('../models/user');
const Promocode = require('../models/promocode');
const async = require('async');

const algoliasearch = require('algoliasearch');
const { Mongoose } = require('mongoose');
var client = algoliasearch('H3KEKXEIM1', 'bb9d548ad94925bab6402392c290aebb');
var index = client.initIndex('GigSchema');


const http = require("http");
const path = require("path");
const fs = require("fs");

const express = require("express");

// const app = express();
// const httpServer = http.createServer(app);

// const PORT = process.env.PORT || 3000;

// httpServer.listen(PORT, () => {
//   console.log(`Server is listening on port ${PORT}`);
// });

// put the HTML file containing your form in a directory named "public" (relative to where this script is located)
router.get("/", express.static(path.join(__dirname, "./views/main")));

const multer = require("multer");

const handleError = (err, res) => {
  res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");
};

const upload = multer({
  dest: "./uploads/files"
  // you might also want to set some limits: https://github.com/expressjs/multer#limits
});







router.get('/', (req, res, next) => {
    Gig
        .find({}, function (err, gigs) {
            res.render('main/home', {gigs: gigs})
        })
});


router
    .route('/search')
    .get((req, res) => {

      /*  if (req.query.q) {
            index
                .search(req.query.q, function (err, content) {
                    res.render('main/search_results', {
                        content: content,
                        search_result: req.query.q
                    });
                })
        } */
     
            Gig
            .find({}, function (err, gigs) {
                let arrrevers = gigs.reverse();
                let slicedArray = arrrevers.slice(0, 8);
                res.render('main/search_results', {slicedArray: slicedArray})
            })
        

    })
    .post((req, res) => {
        res.redirect('/search/?q=' + req.body.search_input)
    })


//GET request to /gigs
router.get('/gigs', (req, res) => {
    Gig
        .find({
            owner: req.user._id
        }, function (err, gigs) {
            res.render('main/gigs', {gigs: gigs})
        })
});

//Handle GET and POST request to /add-new-gig
router
    .route('/add-new-gig')
    .get((req, res) => {
        res.render('main/add-new-gig');
    })
    .post((req, res) => {
        async.waterfall([function (callback) {
                let gig = new Gig();
                gig.owner = req.user._id;
                gig.name  = req.body.gig_name;
                gig.title = req.body.gig_title;
                gig.category = req.body.gig_category;
                gig.about = req.body.gig_about;
                gig.price = req.body.gig_price;
                gig.file = req.body.file;
                console.log(gig, "gggggggggggggggggggggggggggg")
                gig.save(function (err, gig) {
                    User
                        .update({
                            _id: req.user._id
                        }, {
                            $push: {
                                gigs: gig._id
                            }
                        }, function (err, count) {
                            res.redirect('/gigs');
                        })
                });
            }
        ]);

        
            "/upload",
            upload.single("file" /* name attribute of <file> element in your form */),
            (req, res) => {
              const tempPath = req.file.path;
              const targetPath = path.join(__dirname, "./uploads/files/image.png");
          
              if (path.extname(req.file.originalname).toLowerCase() === ".png") {
                fs.rename(tempPath, targetPath, err => {
                  // if (err) return handleError(err, res);
          
                  res
                    .status(200)
                    .contentType("text/plain")
                    .end("File uploaded!");
                });
              } else {
                fs.unlink(tempPath, err => {
                  // if (err) return handleError(err, res);
          
                  res
                    .status(403)
                    .contentType("text/plain")
                    .end("Only .png files are allowed!");
                });
              }
            }
          
    }
    
    );



//Handle single gig req
router.get('/service_detail/:id', (req, res, next) => {

    Gig
        .findOne({ _id: req.params.id })
        .populate('owner')
        .exec(function (err, gig) {
            res.render('main/service_detail', {gig: gig});
        })
    })


/* router.post('/service_detail/main/:id', function(req, res) {
    
   Mongoose.model("user").remove({_id:req.params.id}, function(err, res, delData)  { 
          res.redirect('/search/');
   });
   res.send(); 
   
}); */

        // Gig
        // let user = req.user.gigs;
        // let userid = req.params.id;

        // user = user.filter(i => {
        //     if (i.userid !== userid) {
        //         return true;
        //     }
        //     return false;
        // });

        // user.findByIdAndRemove(userid, function (err, docs) {
        //     if (err){
        //         console.log(err)
        //     }
        //     else{
        //         console.log("Removed User : ", docs);
        //     }
        // });


        

    
        // res.redirect('/search/');
  
     






    // .delete('service_detail/:id', (req, res) =>{

    //     console.log("dsdsdsdsdsdsdsdsdsdsdsdsdsdsd")

    //     Gig
    //     const userid = req.params.id;

    //     gigs = gigs.filter(i => {
    //         if (i.userid !== userid) {
    //             return true;
    //         }
    //         return false;
    //     });
    //     res.send('Book is deleted');
    // });




//Handle Promo code API
router.get('/api/add-promocode', (req, res) => {
    var promocode = new Promocode();
    promocode.name = "testcoupon";
    promocode.discount = 0.4;
    promocode.save(function (err) {
        res.json("Successfull")
    })
})

//Handle Post promocode API
router.post('/promocode', (req, res) => {
    var promocode = req.body.promocode;
    var totalPrice = req.session.price;
    Promocode.findOne({
        name: promocode
    }, function (err, foundCode) {
        if (foundCode) {
            var newPrice = foundCode.discount * totalPrice;
            newPrice = totalPrice - newPrice;
            req.session.price = newPrice;
            res.json(newPrice);
        } else {
            res.json(0)
        }
    });
});

module.exports = router;
