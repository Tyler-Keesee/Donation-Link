document.addEventListener('DOMContentLoaded', () => {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.querySelector('.custom-amount-input');
    const donateButton = document.getElementById('donateButton');
    let selectedAmount = 0;

    // Handle amount button clicks
    amountButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            if (button.classList.contains('custom')) {
                customAmountInput.style.display = 'block';
                button.classList.add('active');
            } else {
                customAmountInput.style.display = 'none';
                button.classList.add('active');
                selectedAmount = parseInt(button.dataset.amount);
            }
        });
    });

    // Handle custom amount input
    const customAmount = document.getElementById('customAmount');
    customAmount.addEventListener('input', (e) => {
        selectedAmount = Number(e.target.value) || 0;
    });

    // Update donate button click handler
    donateButton.addEventListener('click', async () => {
        if (!Number.isFinite(selectedAmount) || selectedAmount < 0.5 || selectedAmount > 5000 || Math.round(selectedAmount * 100) !== selectedAmount * 100) {
            alert('Please select or enter a valid donation amount');
            return;
        }

        try {
            // Create payment session
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: Math.round(selectedAmount * 100) // Whole cents only
                })
            });

            const session = await response.json();
            if (!response.ok || typeof session.url !== 'string') {
                throw new Error('Checkout could not be started');
            }
            const destination = new URL(session.url);
            if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') {
                throw new Error('Unexpected checkout destination');
            }
            window.location.assign(destination.href);
        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment processing failed. Please try again.');
        }
    });

    const confetti = () => {
        const colors = ['#667eea', '#764ba2', '#ffffff'];
        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            particle.style.opacity = Math.random();
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 5000);
        }
    };

    // Add some nice hover effects
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseover', () => {
            button.style.transition = 'all 0.3s ease';
        });
    });
});
