const mongoose = require('mongoose');

const financeApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    },
    provider: {
        type: String,
        enum: ['Local Bank', 'Microfinance', 'Oromia Bank', 'Dashen Bank', 'AutoMarket Direct'],
        default: 'AutoMarket Direct'
    },
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'approved', 'rejected'],
        default: 'submitted'
    },
    personalInfo: {
        fullName: String,
        dob: String,
        ssn: String,
        phone: String
    },
    employmentInfo: {
        employer: String,
        jobTitle: String,
        yearsEmployed: Number,
        annualIncome: Number
    },
    financialInfo: {
        downPayment: Number,
        loanAmount: Number,
        creditScore: String
    },
    providerReferenceId: String, // External API ID
    history: [
        {
            status: String,
            comment: String,
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('FinanceApplication', financeApplicationSchema);
