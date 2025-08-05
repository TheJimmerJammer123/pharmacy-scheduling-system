# 🏥 Pharmacy Scheduling System - Specialized Subagents

## Overview

This directory contains 8 specialized subagents designed specifically for the pharmacy scheduling system. Each subagent is a domain expert with deep knowledge of their specific area, comprehensive tool access, and strict security protocols for handling employee data.

## 🎯 Complete Subagent Portfolio

### 🏆 **High Priority Subagents**

#### 1. [🏥 Pharmacy Frontend Developer](./pharmacy-frontend-developer.md)
**Specialization**: React, TypeScript, Tailwind CSS, Supabase integration  
**Key Focus**: Employee data protection, HIPAA compliance, pharmacy workflows  
**Core Capabilities**:
- React 18 + TypeScript development with shadcn/ui components
- Real-time Supabase integration with proper authentication
- Employee scheduling interfaces with drag-and-drop functionality
- SMS communication interfaces with conversation threading
- Document upload interfaces with progress tracking
- AI chatbot integration for natural language queries

#### 2. [🗄️ Pharmacy Database Administrator](./pharmacy-database-administrator.md)
**Specialization**: PostgreSQL/Supabase, performance optimization, data integrity  
**Key Focus**: Employee data security, audit logging, compliance readiness  
**Core Capabilities**:
- Complete pharmacy schema management (stores, contacts, schedules, messages)
- Row Level Security (RLS) implementation for granular access control
- Performance optimization with strategic indexing and query tuning
- Automated backup and point-in-time recovery procedures
- Comprehensive audit logging for compliance requirements

#### 3. [📱 Pharmacy SMS Integration Specialist](./pharmacy-sms-integration-specialist.md)
**Specialization**: Capcom6 Android SMS Gateway, real-time messaging  
**Key Focus**: Employee privacy, communication compliance, message threading  
**Core Capabilities**:
- Bi-directional SMS communication via Capcom6 gateway (100.126.232.47:8080)
- Webhook processing for real-time message updates
- Message conversation threading and history management
- Bulk messaging capabilities for schedule notifications
- SMS delivery tracking and retry logic

#### 4. [🤖 Pharmacy AI Chatbot Developer](./pharmacy-ai-chatbot-developer.md)
**Specialization**: OpenRouter integration, intelligent query strategies  
**Key Focus**: Multi-source data analysis, role-based AI responses, employee privacy  
**Core Capabilities**:
- OpenRouter API with Qwen3 Coder model for advanced reasoning
- Intelligent query routing (REST API, SQL, SMS, multi-source)
- Complex schedule analytics and operational optimization
- Role-based AI responses (manager vs. employee access levels)
- Comprehensive audit logging for AI interactions

#### 5. [🔄 Pharmacy n8n Automation Specialist](./pharmacy-n8n-automation-specialist.md)
**Specialization**: Workflow automation, system integration, process optimization  
**Key Focus**: Employee communication automation, schedule management, compliance  
**Core Capabilities**:
- Visual workflow creation with n8n platform (localhost:5678)
- Automated schedule notifications and conflict detection
- Employee onboarding and offboarding workflows
- Document processing automation with status tracking
- Emergency communication workflows for urgent notifications

### 🛠️ **Supporting Specialist Subagents**

#### 6. [📄 Pharmacy Document Processing Specialist](./pharmacy-document-processing-specialist.md)
**Specialization**: Excel/PDF ingestion, data transformation, automated imports  
**Key Focus**: Data validation, processing audit trails, employee data protection  
**Core Capabilities**:
- Multi-format document processing (Excel, PDF, CSV)
- Template-based data mapping and transformation
- Comprehensive validation and error handling
- Progress tracking with real-time status updates
- Complete import history and audit trails

#### 7. [🐳 Pharmacy Docker Orchestration Specialist](./pharmacy-docker-orchestration-specialist.md)
**Specialization**: Container management, service orchestration, development environment  
**Key Focus**: Service reliability, resource optimization, security hardening  
**Core Capabilities**:
- Docker Compose v2.38.2 multi-container orchestration
- 8-service architecture with health monitoring
- Hot reload development environment for React frontend
- Comprehensive backup and disaster recovery procedures
- Performance monitoring and resource optimization

#### 8. [🔒 Pharmacy Security & Authentication Specialist](./pharmacy-security-authentication-specialist.md)
**Specialization**: Security controls, authentication, HIPAA compliance  
**Key Focus**: Employee data protection, regulatory compliance, incident response  
**Core Capabilities**:
- JWT-based authentication with role-based access control
- Row Level Security implementation for all sensitive data
- Comprehensive audit logging and security monitoring
- HIPAA compliance framework and data retention policies
- Incident response procedures and security testing

## 🔄 Subagent Coordination

### **Workflow Integration**
- **Frontend ↔ Database**: UI components integrated with secure data access
- **SMS ↔ AI**: Automated responses and intelligent message routing
- **Automation ↔ All**: Workflows coordinate across all system components
- **Security**: Overlays all subagents with consistent security controls

### **Development Workflow**
1. **Security Specialist**: Establishes security requirements and policies
2. **Database Administrator**: Implements secure schema and access controls
3. **Docker Specialist**: Sets up reliable development and deployment environment
4. **Frontend Developer**: Builds user interfaces with proper security integration
5. **SMS Specialist**: Implements secure communication channels
6. **AI Developer**: Creates intelligent features with privacy controls
7. **Document Specialist**: Handles data ingestion with validation and audit
8. **Automation Specialist**: Orchestrates workflows across all components

## 🎯 **Usage Guidelines**

### **When to Use Each Subagent**

| **Task Type** | **Primary Subagent** | **Supporting Subagents** |
|---------------|---------------------|-------------------------|
| UI Development | Frontend Developer | Security, Database |
| Database Changes | Database Administrator | Security, Docker |
| SMS Features | SMS Integration | AI, Automation |
| AI Features | AI Chatbot Developer | Database, Security |
| Workflow Creation | n8n Automation | SMS, AI, Database |
| File Processing | Document Processing | Database, Security |
| System Deployment | Docker Orchestration | Security, Database |
| Security Issues | Security & Authentication | All others as needed |

### **Collaboration Patterns**

#### **Complex Feature Development**
1. **Security Specialist**: Define security requirements
2. **Database Administrator**: Design data schema and access patterns
3. **Frontend Developer**: Create user interface components
4. **Integration Specialists**: Connect external services (SMS, AI, Documents)
5. **Automation Specialist**: Create supporting workflows
6. **Docker Specialist**: Ensure proper deployment and monitoring

#### **Issue Resolution**
1. **Identify primary domain** (frontend, backend, integration, infrastructure)
2. **Engage primary subagent** for initial diagnosis and resolution
3. **Coordinate with related subagents** for comprehensive solution
4. **Security review** for any changes affecting sensitive data

## 🔒 **Security & Compliance**

### **Employee Data Protection Standards**
All subagents adhere to strict employee data protection protocols:
- **Access Control**: Role-based permissions with principle of least privilege
- **Audit Logging**: Comprehensive tracking of all data access and modifications
- **Data Encryption**: At-rest and in-transit encryption for sensitive information
- **Privacy Controls**: Anonymization and data masking for non-production environments
- **Retention Policies**: Automated cleanup based on regulatory requirements

### **HIPAA Compliance Readiness**
While this is an employee scheduling system, all subagents are designed with healthcare compliance considerations:
- **No Patient Data**: System specifically avoids processing patient information
- **Employee Privacy**: Strict controls on employee personal information
- **Audit Requirements**: Complete audit trails for compliance reporting
- **Security Controls**: Multiple layers of security for sensitive data protection
- **Incident Response**: Documented procedures for security incidents

## 🚀 **Getting Started**

### **Quick Start with Subagents**
1. **Read the main CLAUDE.md** for project overview and current status
2. **Choose the appropriate subagent** based on your task
3. **Review the subagent's documentation** for specific capabilities and tools
4. **Follow security guidelines** for handling employee data
5. **Coordinate with other subagents** as needed for complex tasks

### **Best Practices**
- **Always prioritize employee data protection** in all development work
- **Follow the Plan → Act → Review workflow** outlined in each subagent
- **Use proper authentication and authorization** for all system access
- **Maintain comprehensive audit logs** for all activities
- **Test thoroughly** before deploying changes to production
- **Document all changes** and maintain version control

---

**Total Subagent Coverage**: 8 specialized agents covering 104.6KB of domain expertise  
**Security Focus**: Employee data protection integrated into all subagents  
**Compliance Ready**: HIPAA considerations and audit requirements built-in  
**Production Ready**: Comprehensive testing, monitoring, and incident response procedures  

Remember: These subagents are designed to work together as a cohesive team, each bringing specialized expertise while maintaining consistent security standards and pharmacy operational focus.