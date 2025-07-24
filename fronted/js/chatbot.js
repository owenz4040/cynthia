/**
 * Intelligent Chatbot Widget for Rental System
 * Provides comprehensive assistance and information
 */

class RentalChatbot {
    constructor(options = {}) {
        this.apiBase = options.apiBase || (window.Config ? window.Config.API_BASE : 'http://localhost:5000/api');
        this.container = null;
        this.widget = null;
        this.messagesContainer = null;
        this.inputField = null;
        this.isOpen = false;
        this.isTyping = false;
        this.conversations = [];
        
        // Initialize chatbot
        this.init();
    }
    
    init() {
        this.createChatbotHTML();
        this.attachEventListeners();
        this.loadWelcomeMessage();
        
        // Show initial notification after delay
        setTimeout(() => {
            this.showNotificationDot();
        }, 5000);
        
        console.log('Rental System Chatbot initialized');
    }
    
    createChatbotHTML() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'chatbot-container';
        this.container.innerHTML = `
            <button class="chatbot-toggle" id="chatbotToggle">
                <i class="fas fa-comments"></i>
            </button>
            
            <div class="chatbot-widget" id="chatbotWidget">
                <div class="chatbot-header">
                    <h3>🤖 Cynthia Assistant</h3>
                    <div class="status">🟢 Online - Ready to help!</div>
                    <button class="chatbot-close" id="chatbotClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="chatbot-welcome">
                        <div class="welcome-icon">🤖</div>
                        <h4>Welcome to Cynthia Assistant!</h4>
                        <p>I'm your intelligent rental system assistant. I can help you with properties, registration, booking, system features, and much more!</p>
                        
                        <div class="quick-actions">
                            <div class="quick-action" data-message="What features does this system have?">
                                ✨ System Features
                            </div>
                            <div class="quick-action" data-message="How do I register?">
                                📝 Registration Guide
                            </div>
                            <div class="quick-action" data-message="Show me available properties">
                                🏠 View Properties
                            </div>
                            <div class="quick-action" data-message="How can I book a property?">
                                📅 Booking Help
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="chatbot-input-area">
                    <div class="chatbot-suggestions" id="chatbotSuggestions" style="display: none;">
                        <!-- Dynamic suggestions will be inserted here -->
                    </div>
                    
                    <div class="chatbot-input-container">
                        <textarea 
                            class="chatbot-input" 
                            id="chatbotInput" 
                            placeholder="Need assistance? Type your message here..."
                            rows="1"
                        ></textarea>
                        <button class="chatbot-send" id="chatbotSend">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Get references to elements
        this.widget = document.getElementById('chatbotWidget');
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.inputField = document.getElementById('chatbotInput');
    }
    
    attachEventListeners() {
        // Toggle chatbot
        document.getElementById('chatbotToggle').addEventListener('click', () => {
            this.toggleChatbot();
        });
        
        // Close chatbot
        document.getElementById('chatbotClose').addEventListener('click', () => {
            this.closeChatbot();
        });
        
        // Send message
        document.getElementById('chatbotSend').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Input field events
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.inputField.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Quick actions
        this.messagesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action')) {
                const message = e.target.getAttribute('data-message');
                this.sendQuickMessage(message);
            }
        });
        
        // Suggestion chips
        document.getElementById('chatbotSuggestions').addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-chip')) {
                const message = e.target.textContent;
                this.sendQuickMessage(message);
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChatbot();
            }
        });
    }
    
    toggleChatbot() {
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }
    
    openChatbot() {
        this.widget.classList.add('active');
        document.getElementById('chatbotToggle').classList.add('active');
        this.isOpen = true;
        
        // Focus input field
        setTimeout(() => {
            this.inputField.focus();
        }, 300);
        
        // Remove notification dot
        this.removeNotificationDot();
        
        // Load suggestions if first time opening
        if (this.conversations.length === 0) {
            this.loadSuggestions();
        }
    }
    
    closeChatbot() {
        this.widget.classList.remove('active');
        document.getElementById('chatbotToggle').classList.remove('active');
        this.isOpen = false;
    }
    
    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message || this.isTyping) return;
        
        // Clear input
        this.inputField.value = '';
        this.autoResizeTextarea();
        
        // Add user message to chat
        this.addUserMessage(message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to API
            const response = await this.callChatbotAPI(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addBotMessage(response.response, response.category, response.confidence);
            
            // Update suggestions based on category
            this.updateSuggestions(response.category);
            
        } catch (error) {
            console.error('Chatbot API error:', error);
            this.hideTypingIndicator();
            this.addBotMessage(
                "I'm sorry, I'm experiencing some technical difficulties. Please try again in a moment or contact support if the problem persists.",
                'error',
                0.5
            );
        }
    }
    
    sendQuickMessage(message) {
        this.inputField.value = message;
        this.sendMessage();
    }
    
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user message-enter';
        messageDiv.innerHTML = `
            ${this.formatMessage(message)}
            <div class="message-timestamp">${this.formatTimestamp(new Date())}</div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store in conversations
        this.conversations.push({
            type: 'user',
            message: message,
            timestamp: new Date()
        });
    }
    
    addBotMessage(message, category = 'general', confidence = 0.8) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot message-enter';
        
        const confidenceClass = confidence > 0.8 ? 'confidence-high' : 
                               confidence > 0.5 ? 'confidence-medium' : 'confidence-low';
        
        messageDiv.innerHTML = `
            <div class="bot-info">
                <div class="bot-avatar">🤖</div>
                <span>Cynthia Assistant</span>
                <span class="confidence-indicator ${confidenceClass}" title="Confidence: ${Math.round(confidence * 100)}%"></span>
            </div>
            ${this.formatMessage(message)}
            <div class="message-timestamp">${this.formatTimestamp(new Date())}</div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store in conversations
        this.conversations.push({
            type: 'bot',
            message: message,
            category: category,
            confidence: confidence,
            timestamp: new Date()
        });
    }
    
    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="bot-avatar">🤖</div>
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        
        // Disable send button
        document.getElementById('chatbotSend').disabled = true;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        this.isTyping = false;
        document.getElementById('chatbotSend').disabled = false;
    }
    
    async callChatbotAPI(message) {
        const requestData = {
            message: message,
            context: {
                timestamp: new Date().toISOString(),
                page: window.location.pathname,
                conversations_count: this.conversations.length
            }
        };
        
        // Add authentication token if available
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${this.apiBase}/chatbot/message`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    }
    
    async loadSuggestions() {
        try {
            const response = await fetch(`${this.apiBase}/chatbot/suggestions`);
            if (response.ok) {
                const data = await response.json();
                this.displaySuggestions(data.suggestions);
            }
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        }
    }
    
    displaySuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('chatbotSuggestions');
        
        if (suggestions && suggestions.length > 0) {
            const shuffled = suggestions.sort(() => 0.5 - Math.random()).slice(0, 4);
            suggestionsContainer.innerHTML = shuffled.map(suggestion => 
                `<div class="suggestion-chip">${suggestion}</div>`
            ).join('');
            
            suggestionsContainer.style.display = 'flex';
        }
    }
    
    updateSuggestions(category) {
        const categorysuggestions = {
            'registration': [
                'How do I verify my email?',
                'What information do I need to register?',
                'How long does registration take?'
            ],
            'properties': [
                'Show me property statistics',
                'What locations are available?',
                'How do I search for properties?'
            ],
            'booking': [
                'What payment methods are accepted?',
                'Can I cancel my booking?',
                'How do I get booking confirmation?'
            ],
            'features': [
                'Is the system mobile-friendly?',
                'What security measures are in place?',
                'How does the admin dashboard work?'
            ]
        };
        
        const suggestions = categorysuggestions[category] || [
            'How can I contact support?',
            'What are the pricing options?',
            'Show me system statistics'
        ];
        
        this.displaySuggestions(suggestions);
    }
    
    formatMessage(message) {
        // Convert markdown-like formatting to HTML
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ')
            .replace(/(\d+)\. /g, '$1. ');
    }
    
    formatTimestamp(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    autoResizeTextarea() {
        this.inputField.style.height = 'auto';
        this.inputField.style.height = Math.min(this.inputField.scrollHeight, 80) + 'px';
    }
    
    showNotificationDot() {
        const toggle = document.getElementById('chatbotToggle');
        if (!this.isOpen && toggle) {
            toggle.classList.add('pulse');
        }
    }
    
    removeNotificationDot() {
        const toggle = document.getElementById('chatbotToggle');
        if (toggle) {
            toggle.classList.remove('pulse');
        }
    }
    
    loadWelcomeMessage() {
        // Add welcome message after initialization
        setTimeout(() => {
            if (this.conversations.length === 0) {
                this.addBotMessage(
                    "👋 **Welcome to Cynthia Assistant!**\n\nI'm your intelligent rental system helper. I can assist you with:\n\n• 🏠 **Property browsing and booking**\n• 👤 **Account registration and login**\n• ⚙️ **System features and pricing**\n• 🛠️ **Technical support and troubleshooting**\n\n💡 **Just ask me anything!** I'm here to make your rental experience smooth and easy.",
                    'welcome',
                    1.0
                );
            }
        }, 1000);
    }
    
    // Public methods for external use
    openWithMessage(message) {
        this.openChatbot();
        setTimeout(() => {
            this.inputField.value = message;
            this.sendMessage();
        }, 500);
    }
    
    showQuickHelp(topic) {
        const helpMessages = {
            'registration': 'How do I register for an account?',
            'login': 'How do I login to my account?',
            'booking': 'How can I book a property?',
            'properties': 'Show me available properties',
            'pricing': 'What are the pricing options?',
            'support': 'How can I get technical support?'
        };
        
        const message = helpMessages[topic] || 'I need help with the system';
        this.openWithMessage(message);
    }
    
    // Accessibility features
    enableKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'c') {
                this.toggleChatbot();
            }
        });
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Don't initialize on admin pages
    if (window.location.pathname.includes('admin') || 
        document.getElementById('loginPage') || 
        document.getElementById('adminDashboard')) {
        return;
    }
    
    // Initialize chatbot
    const chatbot = new RentalChatbot({
        apiBase: window.Config ? window.Config.API_BASE : 'http://localhost:5000/api'
    });
    
    // Make globally accessible
    window.rentalChatbot = chatbot;
    
    // Enable keyboard navigation
    chatbot.enableKeyboardNavigation();
    
    console.log('Rental System Chatbot loaded successfully');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RentalChatbot;
}
