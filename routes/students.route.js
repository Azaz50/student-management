const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // use to delete image
const Student = require('../models/students.model');
const cloudinary = require("../config/cloudinary");


//################################ for image upload ##############################
// @@@@@@@@@@@@@@@@@@@@@@ step 1 @@@@@@@@@@@@@@@@@@@


const storage = multer.diskStorage({
    destination:(req, file, cb) => {
        cb(null, './uploads')
    },
    filename:(req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname)
        cb(null, newFileName);
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image/')){
        cb(null, true); // true means give permission to upload image
    }else{
        cb(new Error('Only images are allowed!'), false)
    }
}
// const upload = multer({
//     storage: storage,
//     fileFilter: fileFilter,
//     limit: {
//         fileSize: 1024 * 1024 * 3, // 3MB
//     }
// })

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 3 },
});

// @@@@@@@@@@@@@@@@@@@@@@ end of step 1 @@@@@@@@@@@@@@@@@@@

// Get All Students
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 3 } = req.query;

        let query = {};
        if (search) {
            query = {
                $or: [
                    { first_name: { $regex: search, $options: 'i' } },
                    { last_name: { $regex: search, $options: 'i' } },
                ],
            };
        }

        const students = await Student.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Student.countDocuments(query);

        res.json({
            students,
            totalPage: Math.ceil(count / limit),
            currentPage: page
        });

    }catch(err) {
        res.status(500).json({ message: err.message });
    }
})

// Get a Single Student
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student){
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    }catch(err) {
        res.status(500).json({ message: err.message });
    }
});


//Add new Student
// router.post('/', upload.single('profile_pic'), async (req, res) => {
//     try {
//         // const newStudent = await Student.create(req.body);
//         const student = new Student(req.body);
//         if (req.file) {
//             student.profile_pic = req.file.filename;
//         }
//         const newStudent = await student.save();
//         res.status(201).json(newStudent);
//     }catch(err) {
//         res.status(500).json({ message: err.message });
//     }
// });


router.post("/", upload.single("profile_pic"), async (req, res) => {
  try {
    const studentData = req.body;

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "students" }
      );

      studentData.profile_pic = result.secure_url;
    }

    const student = await Student.create(studentData);
    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


//Update a Student
router.put('/:id', upload.single('profile_pic'), async (req, res) => {
    try {
        // to update image
        const student = await Student.findById(req.params.id);
        // error comes but image is uploaded so we need to delete this thats why use it.(id changed but still upload thats why i used)
        if (!student) {
            if (req.file.filename) {
                const imagePath = path.join(__dirname, '../uploads', req.file.filename);
                console.log("imagpth", imagePath);
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Error deleting image:', err);
                    }
                });
            }
            return res.status(404).json({ message: 'Student not found' });
        }

        //to delete old image from uploads folder
        if (student.profile_pic && req.file) {
            const imagePath = path.join(__dirname, '../uploads', student.profile_pic);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting image:', err);
                }
            });
        }
        if (req.file) {
            req.body.profile_pic = req.file.filename;
        }


        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
         if (!updatedStudent){
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(updatedStudent);
    }catch(err) {
        res.status(400).json({ message: err.message });
    }
});


//Delete a Student
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id); // this delete the student record but image is still have in uploads folder to delete from uploads folder we need to us 'fs'
        if (!student){
            return res.status(404).json({ message: 'Student not found' });
        }
        //to delete image from uploads folder
        if (student.profile_pic) {
            const imagePath = path.join(__dirname, '../uploads', student.profile_pic);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting image:', err);
                }
            });
        }
        res.json({message: 'Student Deleted'});
    }catch(err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;