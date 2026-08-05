import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../utils/getFileUrl';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiShield, FiCheckCircle, FiBookOpen, FiArrowLeft, FiCreditCard, FiSmartphone, FiGlobe } from 'react-icons/fi';

const Checkout = () => {
  const params = useParams();
  const id = params.id || params.courseId;
  const navigate = useNavigate();
  const { user, updateUserState } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // PAYMENT STATES
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'easypaisa', 'stripe'
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardHolder: '',
  });
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data.course || res.data.data || res.data);
      } catch (err) {
        console.error('Failed to load checkout course:', err);
        toast.error('Could not fetch course details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCourse();
  }, [id]);

  // Helper Validation & Masking Functions
  const handleNameChange = (e) => {
    // Allow ONLY Alphabets and Spaces
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setCardDetails((prev) => ({ ...prev, cardHolder: value }));
  };

  const handleCardNumberChange = (e) => {
    // Allow ONLY Digits, Max 16 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardDetails((prev) => ({ ...prev, cardNumber: value }));
  };

  const handleExpiryChange = (e) => {
    // Format automatically as MM/YY with digits only
    let value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setCardDetails((prev) => ({ ...prev, expiry: value }));
  };

  const handleCvvChange = (e) => {
    // Allow ONLY Digits, Max 3 to 4 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardDetails((prev) => ({ ...prev, cvv: value }));
  };

  const handleAccountNumberChange = (e) => {
    // Allow Digits & Plus sign only
    const value = e.target.value.replace(/[^\d+]/g, '').slice(0, 15);
    setAccountNumber(value);
  };

  // STRICT SUBMIT VALIDATION
  const validatePaymentForm = () => {
    if (course?.price > 0) {
      if (paymentMethod === 'card') {
        const { cardHolder, cardNumber, expiry, cvv } = cardDetails;

        if (!cardHolder.trim() || !/^[a-zA-Z\s]+$/.test(cardHolder.trim())) {
          toast.error('Cardholder name must contain letters only!');
          return false;
        }

        if (cardNumber.length !== 16) {
          toast.error('Card number must be exactly 16 digits!');
          return false;
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
          toast.error('Expiry date must be in valid MM/YY format (e.g. 12/28)!');
          return false;
        }

        if (cvv.length < 3) {
          toast.error('CVV must be 3 or 4 digits!');
          return false;
        }
      } else if (paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') {
        if (!accountNumber.trim()) {
          toast.error('Please enter your mobile account number!');
          return false;
        }
      }
    }
    return true;
  };

  const handleConfirmPaymentAndEnroll = async (e) => {
    e.preventDefault();

    // STRICT INPUT VALIDATION GUARD BEFORE API REQUESTS
    if (!validatePaymentForm()) {
      return;
    }

    setProcessing(true);

    try {
      const paymentPayload = {
        courseId: id,
        paymentInfo: {
          method: paymentMethod,
          amountPaid: course?.price || 0,
          transactionId: 'TXN-' + Date.now(),
        },
      };

      // Process Enrollment API Call (Try endpoint variations safely)
      let res;
      try {
        res = await api.post(`/enrolments/${id}`, paymentPayload);
      } catch (firstErr) {
        res = await api.post('/enrolments', paymentPayload);
      }

      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success('Payment Successful! Enrolled in course 🎉');

        // Update local user state if available
        if (user && updateUserState) {
          const updated = Array.from(new Set([...(user.enrolledCourses || []), id]));
          updateUserState({ ...user, enrolledCourses: updated });
        }

        navigate(`/course-player/${id}`, { replace: true });
      }
    } catch (err) {
      console.error('Enrollment payment error:', err);
      toast.error(err.response?.data?.message || 'Payment processing failed. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-200 font-sans p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 font-sans">
        <h2 className="text-xl font-bold text-rose-400">Course Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">Invalid course identifier provided.</p>
        <button
          onClick={() => navigate('/courses')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
        >
          Browse Courses
        </button>
      </div>
    );
  }

  const isPaid = course?.price > 0;

  const categoryName =
    course?.categoryRef?.name ||
    course?.category?.name ||
    (typeof course?.category === 'string' ? course.category : '') ||
    'Development';

  const instructorName =
    course?.instructorRef?.name ||
    course?.instructor?.name ||
    'Academic Faculty';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-2xl max-w-2xl w-full"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md">
              💳
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Checkout & Course Enrolment</h1>
              <p className="text-xs text-slate-400">Complete your payment to access instant video lessons</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Go Back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* COURSE SUMMARY CARD */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={getFileUrl(course?.thumbnail || course?.coverImage)}
              alt={course?.title}
              className="w-16 h-14 object-cover rounded-xl border border-slate-800 shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
              }}
            />
            <div>
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wide">
                {categoryName}
              </span>
              <h3 className="font-bold text-white text-base leading-tight line-clamp-1">
                {course?.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instructor: <strong className="text-slate-200">{instructorName}</strong>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Total Price</span>
            <span className="text-2xl font-black text-indigo-400">
              {isPaid ? `$${course.price}` : 'FREE'}
            </span>
          </div>
        </div>

        {/* PAYMENT OPTIONS SECTION (ONLY FOR PAID COURSES) */}
        {isPaid && (
          <div className="mb-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Payment Method
            </h3>

            {/* PAYMENT METHOD TAB SELECTOR */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'card'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <FiCreditCard className="w-5 h-5" />
                <span>Credit / Debit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('easypaisa')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <FiSmartphone className="w-5 h-5 text-emerald-400" />
                <span>EasyPaisa / JazzCash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'stripe'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <FiGlobe className="w-5 h-5 text-blue-400" />
                <span>Stripe Gateway</span>
              </button>
            </div>

            {/* CARD INPUT FIELDS WITH STRICT MASKING */}
            {paymentMethod === 'card' && (
              <div className="space-y-3.5 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                {/* Cardholder Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Cardholder Name (Letters Only)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Hasnain"
                    value={cardDetails.cardHolder}
                    onChange={handleNameChange}
                    className="w-full p-2.5 text-xs border border-slate-800 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Card Number (16 Digits)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="16"
                    placeholder="4532 8901 2345 8921"
                    value={cardDetails.cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full p-2.5 text-xs border border-slate-800 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Expiry Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="5"
                      placeholder="12/28"
                      value={cardDetails.expiry}
                      onChange={handleExpiryChange}
                      className="w-full p-2.5 text-xs border border-slate-800 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {/* CVV / CVC */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      CVV / CVC (3-4 Digits)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      placeholder="•••"
                      value={cardDetails.cvv}
                      onChange={handleCvvChange}
                      className="w-full p-2.5 text-xs border border-slate-800 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MOBILE WALLET FIELDS WITH STRICT MASKING */}
            {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Mobile Wallet Account Number
                </label>
                <input
                  type="text"
                  inputMode="tel"
                  placeholder="0300 1234567"
                  value={accountNumber}
                  onChange={handleAccountNumberChange}
                  className="w-full p-2.5 text-xs border border-slate-800 rounded-xl bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  You will receive a prompt on your mobile phone to complete the transaction.
                </p>
              </div>
            )}

            {/* STRIPE GATEWAY INFO */}
            {paymentMethod === 'stripe' && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <FiGlobe className="text-blue-400" /> Stripe Encrypted Gateway
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  You will be securely routed via Stripe's encrypted payment pipeline for instant 1-click checkout.
                </p>
              </div>
            )}
          </div>
        )}

        {/* FEATURES BADGES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5">
            <FiShield className="text-emerald-400 text-sm" /> 256-bit Encrypted
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5">
            <FiCheckCircle className="text-indigo-400 text-sm" /> Instant Access
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5">
            <FiBookOpen className="text-purple-400 text-sm" /> Certificate Included
          </div>
        </div>

        {/* CONFIRM PAYMENT BUTTON */}
        <button
          onClick={handleConfirmPaymentAndEnroll}
          disabled={processing}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all text-sm flex items-center justify-center gap-2"
        >
          {processing
            ? 'Processing Transaction...'
            : isPaid
            ? `Pay $${course?.price} & Complete Enrolment →`
            : 'Confirm Enrolment & Start Learning →'}
        </button>
      </motion.div>
    </div>
  );
};

export default Checkout;
