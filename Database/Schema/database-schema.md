# Database Schema

## Project

AI-Based Car Insurance Claim Analysis and Damage Assessment System

## Database Engineer

Pe Toe

## Status

Database design in progress

## Entities

1. Customer
2. Vehicle
3. PolicyType
4. CoverageType
5. PolicyCoverage
6. Policy
7. Claim
8. ClaimImage
9. AIAnalysis
10. ClaimHistory
11. ClaimOfficer

## Main Relationships

- Customer 1:M Vehicle
- Vehicle 1:M Policy
- PolicyType 1:M Policy
- PolicyType M:N CoverageType
- Policy 1:M Claim
- Claim 1:M ClaimImage
- Claim 1:1 AIAnalysis
- Claim 1:M ClaimHistory
- ClaimOfficer 1:M ClaimHistory

## Design Status

The entities and relationships have been identified.
Detailed attributes, constraints, normalization, and PostgreSQL implementation are still in progress.
