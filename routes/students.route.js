const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // use to delete image
const Student = require('../models/students.model');
const cloudinary = require("../config/cloudinary");
const excel = require('exceljs');



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
  limits: { fileSize: 1024 * 1024 * 5 },
});

// @@@@@@@@@@@@@@@@@@@@@@ end of step 1 @@@@@@@@@@@@@@@@@@@

// Get All Students
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 3 } = req.query;

        let query = { user: req.token.userId };
        if (search) {
            query.$or = [
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
            ];
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
        const student = await Student.findOne({ _id: req.params.id, user: req.token.userId });
        if (!student){
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    }catch(err) {
        res.status(500).json({ message: err.message });
    }
});


router.post("/", upload.single("profile_pic"), async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "students",
        }
      );

      imageUrl = result.secure_url; // ✅ VERY IMPORTANT
    }

    const student = new Student({
      ...req.body,
      profile_pic: imageUrl, // save CLOUDINARY URL
      user: req.token.userId
    });

    const newStudent = await student.save();
    res.status(201).json(newStudent);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

//Update a Student
router.put('/:id', upload.single('profile_pic'), async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, user: req.token.userId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const updatedData = { ...req.body };

        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
                { folder: "students" }
            );
            updatedData.profile_pic = result.secure_url;

            // Optional: Delete old image from Cloudinary if it exists
            if (student.profile_pic) {
                const publicId = student.profile_pic.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`students/${publicId}`);
            }
        }

        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        
        res.json(updatedStudent);
    }catch(err) {
        res.status(400).json({ message: err.message });
    }
});


//Delete a Student
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({ _id: req.params.id, user: req.token.userId });
        if (!student){
            return res.status(404).json({ message: 'Student not found' });
        }
        
        if (student.profile_pic) {
            const publicId = student.profile_pic.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`students/${publicId}`);
        }

        res.json({message: 'Student Deleted'});
    }catch(err) {
        res.status(500).json({ message: err.message });
    }
});

// pdf generation 
router.get('/:id/generate-pdf', async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, user: req.token.userId });
        if (!student){
            return res.status(404).json({ message: 'Student not found' });
        }

        const pdfContent = `
            Student Report
            ----------------
            Image: ${student.profile_pic}
            ID: ${student._id}
            Name: ${student.first_name} ${student.last_name}
            Email: ${student.email}
            Phone: ${student.phone}
            Gender: ${student.gender}
        `;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${student.first_name}_report.pdf`);
        res.send(Buffer.from(pdfContent)); // Replace with actual PDF buffer

    }catch(err) {
        res.status(500).json({ message: err.message });
    }
})


// download excel sheet of student list
router.get('/download/excel', async (req, res) => {
    try {
        const students = await Student.find({ user: req.token.userId });

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Students');

        worksheet.columns = [
            { header: 'ID', key: '_id', width: 30 },
            { header: 'First Name', key: 'first_name', width: 20 },
            { header: 'Last Name', key: 'last_name', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Gender', key: 'gender', width: 10 }
        ];

        students.forEach(student => {
            worksheet.addRow(student);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    }catch(err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;