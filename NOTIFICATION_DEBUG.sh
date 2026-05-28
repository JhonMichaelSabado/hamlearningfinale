#!/usr/bin/env bash

# 🔍 HamLearning Notification System - Complete Diagnostic Script
# Run this to troubleshoot why notifications aren't being sent

echo "======================================"
echo "🔍 NOTIFICATION SYSTEM DIAGNOSTIC"
echo "======================================"
echo ""

# Step 1: Check if environment variables are set
echo "📋 Step 1: Checking Environment Variables"
echo "==========================================="
if [ -z "$EMAIL_USER" ]; then
  echo "❌ EMAIL_USER is NOT set"
else
  echo "✅ EMAIL_USER is set: $EMAIL_USER"
fi

if [ -z "$EMAIL_PASSWORD" ]; then
  echo "❌ EMAIL_PASSWORD is NOT set"
else
  echo "✅ EMAIL_PASSWORD is set (length: ${#EMAIL_PASSWORD})"
fi

if [ -z "$FRONTEND_URL" ]; then
  echo "⚠️  FRONTEND_URL not set (optional)"
else
  echo "✅ FRONTEND_URL is set: $FRONTEND_URL"
fi

echo ""
echo "🔗 API Endpoints to Test"
echo "======================="
echo "1. Health Check:"
echo "   GET https://your-api.vercel.app/api/diagnostics/health"
echo ""
echo "2. Email Status:"
echo "   GET https://your-api.vercel.app/api/diagnostics/email-status"
echo ""
echo "3. Test Email:"
echo "   POST https://your-api.vercel.app/api/diagnostics/test-email"
echo "   Body: { \"to\": \"your.email@gmail.com\" }"
echo ""

echo "✅ Diagnostic complete!"
