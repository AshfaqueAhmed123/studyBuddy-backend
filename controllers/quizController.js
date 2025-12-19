import Quiz from "../models/Quiz.js"

export const getQuizzes = async (req, res, next) => {
    try {
        const quizzes = await Quiz.find({
            userId: req.user._id,
            document: req.params.documentId,
        })
            .populate('document', 'title fileName')
            .sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            count: quizzes.length,
            quiz: quizzes
        });
    } catch (error) {
        next(error)
    }
}

export const getQuizById = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            userId: req.user._id,
        })
        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: "Quiz not found",
                statusCode: 404
            })
        }
        res.status(200).json({
            success: true,
            data: quiz
        })
    } catch (error) {
        next(error)
    }
}

// export const submitQuiz = async (req,res,next) => {
//     try {
//         const {answers} = req.body;
//         if(!Array.isArray(answers)){
//             return res.status(400).json({
//                 success:false,
//                 message:"please provide answer array",
//                 statusCode:400
//             })
//         }
//         const quiz = await Quiz.findOne({
//             _id:req.params.id,
//             userId:req.user._id
//         }) 

//         if(!quiz){
//             return res.status(404).json({
//                 success:false,
//                 error:"Quiz not found",
//                 statusCode:404
//             })
//         }

//         if(quiz.completedAt){
//             return res.status(400).json({
//                 success:false,
//                 message:"quiz already completed",
//                 statusCode:400
//             })
//         }

//         // process answers 
//         let correctCount = 0;
//         let userAnswers = [];

//         answers.forEach(answer => {
//             const {questionIndex, selectedAnswer} = answer;
//             if(questionIndex < quiz.questions.length){
//                 const question = quiz.questions[questionIndex]
//                 const isCorrect = selectedAnswer === question.correctAnswer;

//                 if(isCorrect) correctCount++;

//                 userAnswers.push({
//                     questionIndex,
//                     selectedAnswer,
//                     isCorrect,
//                     answeredAt:new Date()
//                 })

//             }
//         })

//         // calculate score
//         const score = Math.round((correctCount / quiz.totalQuestions) * 100) || 0

//         console.log(score)
//         // update quiz
//         quiz.userAnswers = userAnswers;
//         quiz.score = score;
//         quiz.completedAt = new Date();



//         await quiz.save()

//         res.status(200).json({
//             success:true,
//             data:{
//                 quizId:quiz._id,
//                 score,
//                 correctCount,
//                 totalQuestions:quiz.totalQuestions,
//                 percentage:score,
//                 userAnswers
//             },
//             message:"quiz submitted successfully"
//         })
//     } catch (error) {
//         next(error)
//     }
// }

export const submitQuiz = async (req, res, next) => {
    try {
        const { answers } = req.body;
        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "please provide answer array",
                statusCode: 400
            })
        }

        const quiz = await Quiz.findOne({
            _id: req.params.id,
            userId: req.user._id
        })

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: "Quiz not found",
                statusCode: 404
            })
        }

        if (quiz.completedAt) {
            return res.status(400).json({
                success: false,
                message: "quiz already completed",
                statusCode: 400
            })
        }

        // process answers
        let correctCount = 0;
        let userAnswers = [];

        
        answers.forEach(answer => {
            const { questionIndex, selectedAnswer } = answer;

            if (questionIndex >= quiz.questions.length) return;

            const question = quiz.questions[questionIndex];

            const match = question.correctAnswer.match(/\d+/);

            if (!match) {
                userAnswers.push({
                    questionIndex,
                    selectedAnswer,
                    isCorrect: false,
                    answeredAt: new Date()
                });
                return;
            }

            const correctOptionIndex = parseInt(match[0], 10) - 1;
            const correctOptionText = question.options[correctOptionIndex];

            const isCorrect =
                typeof selectedAnswer === "string" &&
                typeof correctOptionText === "string" &&
                selectedAnswer.trim() === correctOptionText.trim();

            if (isCorrect) correctCount++;

            userAnswers.push({
                questionIndex,
                selectedAnswer,
                isCorrect,
                answeredAt: new Date()
            });
        });


        // calculate score
        const score = Math.round((correctCount / quiz.totalQuestions) * 100) || 0

        // update quiz
        quiz.userAnswers = userAnswers;
        quiz.score = score;
        quiz.completedAt = new Date();

        await quiz.save()

        res.status(200).json({
            success: true,
            data: {
                quizId: quiz._id,
                score,
                correctCount,
                totalQuestions: quiz.totalQuestions,
                percentage: score,
                userAnswers
            },
            message: "quiz submitted successfully"
        })
    } catch (error) {
        next(error)
    }
}

// TODO : fix submit quiz

export const getQuizResults = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            userId: req.user._id
        })

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: "Quiz not found",
                statusCode: 404
            })
        }
        if (!quiz.completedAt) {
            return res.status(400).json({
                success: false,
                message: "quiz not completed yet",
                statusCode: 400
            })
        }


        // build detailed results
        const detailedResults = quiz.questions.map((question, index) => {
            const userAnswer = quiz.userAnswers.find(a => a.questionIndex === index);

            return {
                questionIndex: index,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                selectedAnswer: userAnswer?.selectedAnswer || null,
                isCorrect: userAnswer?.isCorrect || false,
                explanation: question.explanation
            }
        })

        res.status(200).json({
            success: true,
            data: {
                quiz: {
                    id: quiz._id,
                    title: quiz.title,
                    document: quiz.document,
                    score: quiz.score,
                    totalQuestions: quiz.totalQuestions,
                    completedAt: quiz.completedAt
                },
                results: detailedResults
            },
        })

    } catch (error) {
        next(error)
    }
}

export const deleteQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            userId: req.user._id
        })

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: "Quiz not found",
                statusCode: 404
            })
        }

        await quiz.deleteOne()

        res.status(200).json({
            success: true,
            message: "quiz deleted successfully"
        })
    } catch (error) {
        next(error)
    }
}