let formSubmitInitialized = false; // Add this line at the very top
let carsData = [];


// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('carListings')) {
        fetchCars();
    }
    setupFormSubmissions();
    setupImagePreview();
});

// Fetch cars from backend API once and initialize listings
async function fetchCars() {
    try {
        const res = await fetch('/api/cars');
        if (!res.ok) throw new Error(`Failed to fetch cars: ${res.statusText}`);
        const cars = await res.json();

        // Add cars to global array with duplicate prevention
        cars.forEach(car => {
            if (!carsData.some(existing => existing.id === car.id)) {
                carsData.push(car);
            }
        });

        renderCars(carsData);

        // Setup search & filter event listeners
        document.getElementById('searchButton').addEventListener('click', filterCars);
        document.getElementById('searchInput').addEventListener('keyup', filterCars);
        document.getElementById('applyFilters').addEventListener('click', filterCars);
        document.getElementById('resetFilters').addEventListener('click', resetFilters);
        document.getElementById('sortBy').addEventListener('change', () => sortCars([...carsData]));
        document.getElementById('loadMore').addEventListener('click', loadMoreCars);

    } catch (err) {
        console.error(err);
        document.getElementById('carListings').innerHTML = `<p class="text-danger">Failed to load cars.</p>`;
    }
}

// Render cars on page
function renderCars(cars) {
    const carListings = document.getElementById('carListings');
    carListings.innerHTML = '';
    cars.forEach(car => {
        const carCard = document.createElement('div');
        carCard.className = 'col-md-6 col-lg-4 mb-4';
        carCard.innerHTML = `
            <div class="card car-card h-100">
                <img src="${car.imageUrl || car.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     class="card-img-top" 
                     alt="${car.make} ${car.model}">
                <div class="card-body">
                    <h5 class="card-title">${car.year} ${car.make} ${car.model}</h5>
                    <div class="price">$${car.price.toLocaleString()}</div>
                    <div class="details">
                        <span><i class="fas fa-tachometer-alt"></i> ${car.mileage.toLocaleString()} miles</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${car.location}</span>
                    </div>
                    <p class="card-text">${car.description}</p>
                    <button class="btn btn-outline-primary w-100">View Details</button>
                </div>
            </div>`;
        carListings.appendChild(carCard);
    });
}

// Filter cars based on inputs
function filterCars() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const priceRange = document.getElementById('priceRange').value;
    const yearRange = document.getElementById('yearRange').value;
    const makeFilter = document.getElementById('makeFilter').value;
    const mileageFilter = document.getElementById('mileageFilter').value;

    let filteredCars = carsData.filter(car => {
        const searchMatch = searchInput === '' ||
            (car.make && car.make.toLowerCase().includes(searchInput)) ||
            (car.model && car.model.toLowerCase().includes(searchInput)) ||
            (car.description && car.description.toLowerCase().includes(searchInput));

        let priceMatch = true;
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            priceMatch = max ? (car.price >= min && car.price <= max) : (car.price >= min);
        }

        let yearMatch = true;
        if (yearRange) {
            const [min, max] = yearRange.split('-').map(Number);
            yearMatch = car.year >= min && car.year <= max;
        }

        const makeMatch = makeFilter === '' || car.make === makeFilter;

        let mileageMatch = true;
        if (mileageFilter) {
            const [min, max] = mileageFilter.split('-').map(Number);
            mileageMatch = max ? (car.mileage >= min && car.mileage <= max) : (car.mileage >= min);
        }

        return searchMatch && priceMatch && yearMatch && makeMatch && mileageMatch;
    });

    sortCars(filteredCars);
}

// Reset all filters and show all cars
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('priceRange').value = '';
    document.getElementById('yearRange').value = '';
    document.getElementById('makeFilter').value = '';
    document.getElementById('mileageFilter').value = '';
    renderCars(carsData);
}

// Sort cars according to dropdown
function sortCars(cars) {
    const sortBy = document.getElementById('sortBy').value;
    switch (sortBy) {
        case 'price-low': cars.sort((a, b) => a.price - b.price); break;
        case 'price-high': cars.sort((a, b) => b.price - a.price); break;
        case 'year-new': cars.sort((a, b) => b.year - a.year); break;
        case 'year-old': cars.sort((a, b) => a.year - b.year); break;
    }
    renderCars(cars);
}

// Load more cars (static example) with duplicate prevention
function loadMoreCars() {
    const moreCars = [
        { id: 7, make: 'Jeep', model: 'Wrangler', year: 2019, price: 31500, mileage: 28000, location: 'Denver, CO', image: 'https://images.unsplash.com/photo-1628527305156-5a04358ac08d?auto=format&fit=crop&w=1470&q=80', description: 'Jeep Wrangler Unlimited with off-road package.' },
        { id: 8, make: 'Mercedes', model: 'C-Class', year: 2020, price: 36500, mileage: 22000, location: 'Boston, MA', image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1470&q=80', description: 'Luxury Mercedes C300 with premium package.' }
    ];

    moreCars.forEach(car => {
        if (!carsData.some(existing => existing.id === car.id)) {
            carsData.push(car);
        }
    });

    renderCars(carsData);

    const loadMoreBtn = document.getElementById('loadMore');
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'No More Cars';
}

function setupFormSubmissions() {
    // Prevent duplicate initialization
    if (formSubmitInitialized) return;
    formSubmitInitialized = true;
    
    const sellForm = document.getElementById('carSellingForm');
    if (!sellForm) return;

    // Remove any existing listeners
    const newForm = sellForm.cloneNode(true);
    sellForm.parentNode.replaceChild(newForm, sellForm);
    
    let isSubmitting = false;
    
    document.getElementById('carSellingForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Critical: Blocks other listeners
        
        if (isSubmitting) return;
        isSubmitting = true;

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

        try {
            // Remove any existing alerts
            const oldAlert = document.querySelector('.submission-alert');
            if (oldAlert) oldAlert.remove();
            
            const response = await fetch('/api/cars', {
                method: 'POST',
                body: new FormData(this)
            });

            if (!response.ok) throw new Error('Submission failed');

            // Show success message
            const successHTML = `
            <div class="submission-alert alert alert-success mt-3">
                <i class="fas fa-check-circle me-2"></i>
                Car listed successfully! Redirecting...
            </div>`;
            this.insertAdjacentHTML('afterend', successHTML);

            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'view.html?success=true';
            }, 2000);

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            isSubmitting = false;
        }
    });
}

// Image preview for form
function setupImagePreview() {
    const imageInput = document.getElementById('carImage');
    if (imageInput) {
        imageInput.addEventListener('change', function () {
            const previewContainer = document.getElementById('imagePreview');
            previewContainer.innerHTML = '';
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-image';
                    previewContainer.appendChild(img);
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

