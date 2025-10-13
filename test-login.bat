@echo off
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"owner@example.com\",\"password\":\"password\"}"