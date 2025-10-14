# OptimalPath - Warehouse Pathfinding Application 🏭📍

A modern, high-performance FastAPI-based web application for warehouse floor plan management and optimal pathfinding. Built with a focus on performance, scalability, and user experience.

## ✨ Features

- **Interactive Grid Editor**: Create and modify warehouse floor plans with an intuitive web interface
- **Advanced Pathfinding**: Multiple algorithms (A*, Nearest Neighbor, Optimal TSP) for different scenarios
- **Product Management**: Track products and their locations within the warehouse
- **Image Processing**: Upload floor plan images and convert them to grids automatically
- **Real-time Performance**: Optimized algorithms with caching for fast response times
- **Modern UI**: Responsive, cyber-themed interface with performance optimizations
- **RESTful API**: Well-documented API with automatic OpenAPI/Swagger documentation

## 🏗️ Architecture

```
findOptimalPath_github/
├── app/                    # Main application package
│   ├── api/               # API route modules
│   │   ├── grid_routes.py
│   │   ├── image_routes.py
│   │   ├── pathfinding_routes.py
│   │   └── product_routes.py
│   ├── core/              # Core application components
│   │   ├── database.py    # Database connection & management
│   │   ├── models.py      # Pydantic models
│   │   ├── repositories.py # Repository pattern implementation
│   │   ├── exceptions.py  # Custom exceptions
│   │   └── middleware.py  # Custom middleware
│   ├── services/          # Business logic layer
│   │   └── pathfinding_service.py
│   └── utils/             # Utility functions
│       └── helpers.py
├── config/                # Configuration management
│   ├── settings.py        # Application settings
│   └── logging_config.py  # Logging configuration
├── static/                # Static assets
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── images/           # Images
├── templates/             # Jinja2 templates
├── uploads/               # File upload directory
└── logs/                 # Application logs
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- MongoDB 4.4+
- (Optional) Redis for caching

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd findOptimalPath_github
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   mongod
   ```

6. **Run the application**
   ```bash
   # Development mode
   python main_new.py
   
   # Or with uvicorn directly
   uvicorn main_new:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Access the application**
   - Web Interface: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Alternative Docs: http://localhost:8000/redoc

## 📖 Usage Guide

### Grid Management
1. Navigate to the home page (/)
2. Upload a floor plan image or create a grid manually
3. Edit the grid to mark obstacles and free spaces
4. Save your grid for use in pathfinding

### Pathfinding
1. Go to /pathfinding/
2. Select a saved grid
3. Set start and end points
4. Add pickup points if needed
5. Choose pathfinding algorithm:
   - **Optimal**: Best path but slower for many points (≤8 points)
   - **Balanced**: Good performance with decent optimization (≤15 points)
   - **Fast**: Quick results using nearest neighbor heuristic

### Product Management
1. Visit /product_coordinates/
2. Add products with their warehouse coordinates
3. Link products to specific grids
4. Manage product information and locations

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017/` |
| `DATABASE_NAME` | Database name | `floorplan_db` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `false` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` (10MB) |
| `MAX_GRID_SIZE` | Maximum grid dimensions | `1000` |
| `ENABLE_CACHING` | Enable pathfinding cache | `true` |

### Performance Tuning

For production environments:

1. **Database Optimization**
   - Use MongoDB replica sets for high availability
   - Configure appropriate connection pool size
   - Create indexes on frequently queried fields

2. **Caching**
   - Enable Redis caching for pathfinding results
   - Configure appropriate cache TTL values

3. **Server Configuration**
   - Use multiple uvicorn workers
   - Configure reverse proxy (nginx)
   - Enable gzip compression

## 🔍 API Documentation

### Main Endpoints

- `GET /` - Main web interface
- `GET /pathfinding/` - Pathfinding interface
- `GET /product_coordinates/` - Product management interface

### API Endpoints

#### Grid Management
- `POST /api/grid/` - Create new grid
- `GET /api/grid/{grid_id}` - Get grid by ID
- `GET /api/grid/` - List all grids
- `DELETE /api/grid/{grid_id}` - Delete grid

#### Pathfinding
- `POST /api/pathfinding/` - Find optimal path

#### Images
- `POST /api/upload-image/` - Upload image
- `GET /api/image/{image_id}` - Get image
- `POST /api/upload_floor_plan/` - Upload floor plan
- `GET /api/process_image/{filename}` - Process uploaded image

#### Products
- `POST /api/save_product` - Save new product
- `GET /api/products/{grid_id}` - Get products for grid
- `GET /api/product/{product_id}` - Get specific product

For complete API documentation, visit `/docs` when the server is running.

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_pathfinding.py
```

## 🚀 Performance Features

- **Optimized Algorithms**: Multiple pathfinding algorithms for different scenarios
- **Intelligent Caching**: Results caching to avoid redundant computations
- **Database Indexing**: Optimized database queries with proper indexing
- **Async Operations**: Full async support for better concurrency
- **Minified Assets**: Optimized CSS and JavaScript for faster loading
- **Connection Pooling**: Efficient database connection management

## 🛡️ Security Features

- Input validation using Pydantic models
- Rate limiting middleware
- Security headers (XSS protection, CSRF, etc.)
- File upload restrictions and validation
- Structured error handling without sensitive information exposure

## 📈 Monitoring and Logging

- Structured logging with configurable levels
- Request/response logging with unique request IDs
- Performance metrics for pathfinding operations
- Health check endpoint at `/health`
- Rotating log files to prevent disk space issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Development Setup

```bash
# Install development dependencies
pip install -r requirements.txt

# Setup pre-commit hooks (optional)
pre-commit install

# Run code formatting
black app/ config/
flake8 app/ config/

# Type checking
mypy app/
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Image Processing Fails**
   - Check if OpenCV is properly installed
   - Verify uploaded file is a valid image
   - Ensure sufficient disk space

3. **Pathfinding Takes Too Long**
   - Reduce grid size or number of pickup points
   - Use "fast" or "balanced" algorithm
   - Enable caching

4. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process: `pkill -f uvicorn`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- MongoDB for scalable data storage
- OpenCV for image processing capabilities
- Tailwind CSS for the utility-first styling approach