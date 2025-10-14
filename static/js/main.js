class GridEditor {
    constructor() {
        this.grid = [];
        this.imageId = null;
        this.actualWidth = 0;
        this.actualLength = 0;
        this.cellSize = 30;
        this.mode = 'obstacle'; // Current editing mode
        this.isEditorMode = false;
        
        // Drag functionality state
        this.isDragging = false;
        this.dragMode = null; // 'obstacle' or 'clear'
        this.lastProcessedCell = null;
        
        // Performance optimizations
        this.optimizeForPerformance();
        
        // Initialize elements and only proceed if successful
        if (this.initializeElements()) {
            this.bindEvents();
            console.log('GridEditor initialized successfully');
        } else {
            console.error('Failed to initialize GridEditor: Missing required DOM elements');
        }
    }

    optimizeForPerformance() {
        // Disable smooth scrolling for better performance during grid interactions
        document.documentElement.style.scrollBehavior = 'auto';
        
        // Optimize rendering
        if (document.body) {
            document.body.style.willChange = 'auto';
        }
        
        // Reduce memory usage by cleaning up unused event listeners
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    cleanup() {
        // Clean up any remaining event listeners or intervals
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
    }

    initializeElements() {
        // Setup screen elements
        this.gridSetupScreen = document.getElementById('gridSetupScreen');
        this.gridEditorView = document.getElementById('gridEditorView');
        
        // Input elements
        this.rowsInput = document.getElementById('rows');
        this.colsInput = document.getElementById('cols');
        this.actualWidthInput = document.getElementById('actualWidth');
        this.actualLengthInput = document.getElementById('actualLength');
        this.imageInput = document.getElementById('imageInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.imageName = document.getElementById('imageName');
        this.removeImage = document.getElementById('removeImage');
        this.autoGridBtn = document.getElementById('autoGridBtn');

        // Control buttons
        this.initializeBtn = document.getElementById('initializeBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.obstacleBtn = document.getElementById('obstacleBtn');
        this.clearCellBtn = document.getElementById('clearCellBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.exitEditorBtn = document.getElementById('exitEditorBtn');

        // Grid elements
        this.gridContainer = document.getElementById('gridContainer');
        this.gridElement = document.getElementById('grid');
        this.floorPlanImage = document.getElementById('previewImg'); // Use the preview image
        this.gridInfo = document.getElementById('gridInfo');

        // Check if critical elements exist
        const criticalElements = [
            'gridSetupScreen', 'gridEditorView', 'gridContainer', 'gridElement', 
            'initializeBtn', 'rowsInput', 'colsInput', 'actualWidthInput', 'actualLengthInput'
        ];
        
        const missingElements = criticalElements.filter(elementName => !this[elementName]);
        
        if (missingElements.length > 0) {
            console.error('Missing critical DOM elements:', missingElements);
            return false;
        }

        return true;
    }

    bindEvents() {
        // Setup screen events
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', () => this.imageInput && this.imageInput.click());
        }
        
        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        
        if (this.removeImage) {
            this.removeImage.addEventListener('click', () => this.clearImagePreview());
        }
        
        if (this.autoGridBtn) {
            this.autoGridBtn.addEventListener('click', () => this.generateGridFromImage());
        }
        
        if (this.initializeBtn) {
            this.initializeBtn.addEventListener('click', () => this.enterGridEditor());
        }
        
        // Editor view events
        if (this.obstacleBtn) {
            this.obstacleBtn.addEventListener('click', () => this.setMode('obstacle'));
        }
        
        if (this.clearCellBtn) {
            this.clearCellBtn.addEventListener('click', () => this.setMode('clear'));
        }
        
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => this.clearAllCells());
        }
        
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveGrid());
        }
        
        if (this.exitEditorBtn) {
            this.exitEditorBtn.addEventListener('click', () => this.exitGridEditor());
        }
        
        // Escape key to exit editor
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isEditorMode) {
                this.exitGridEditor();
            }
        });
        
        // Prevent drag and drop on window
        window.addEventListener('dragover', e => e.preventDefault());
        window.addEventListener('drop', e => e.preventDefault());
        
        // Window resize handler for responsive grid
        window.addEventListener('resize', () => {
            if (this.grid.length > 0) {
                this.calculateCellDimensions();
                this.redrawGrid();
            }
        });
    }

    calculateCellDimensions(rows = null, cols = null) {
        // Get grid dimensions
        const numCols = cols || (this.colsInput && this.colsInput.value ? parseInt(this.colsInput.value) : 10);
        const numRows = rows || (this.rowsInput && this.rowsInput.value ? parseInt(this.rowsInput.value) : 10);
        
        // If there's an uploaded image, use its actual dimensions
        if (this.previewImg && this.previewImg.src && this.previewImg.naturalWidth > 0) {
            const imageWidth = this.previewImg.naturalWidth;
            const imageHeight = this.previewImg.naturalHeight;
            
            // Calculate cell size to match image pixels exactly
            const cellWidth = imageWidth / numCols;
            const cellHeight = imageHeight / numRows;
            
            // Keep cells square by using the smaller dimension
            const cellSize = Math.min(cellWidth, cellHeight);
            
            console.log(`Using image dimensions: ${imageWidth}x${imageHeight}, cell size: ${cellSize}px`);
            
            return { 
                cellWidth: cellSize, 
                cellHeight: cellSize,
                gridWidth: cellSize * numCols,
                gridHeight: cellSize * numRows,
                imageWidth: imageWidth,
                imageHeight: imageHeight
            };
        }
        
        // Fallback: use container dimensions if no image
        const containerRect = this.gridContainer.getBoundingClientRect();
        const containerStyle = window.getComputedStyle(this.gridContainer);
        
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const borderLeft = parseFloat(containerStyle.borderLeftWidth) || 0;
        const borderRight = parseFloat(containerStyle.borderRightWidth) || 0;
        const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
        const borderTop = parseFloat(containerStyle.borderTopWidth) || 0;
        const borderBottom = parseFloat(containerStyle.borderBottomWidth) || 0;
        
        const availableWidth = containerRect.width - paddingLeft - paddingRight - borderLeft - borderRight;
        const availableHeight = containerRect.height - paddingTop - paddingBottom - borderTop - borderBottom;
        
        const maxCellWidth = availableWidth / numCols;
        const maxCellHeight = availableHeight / numRows;
        
        const cellSize = Math.min(maxCellWidth, maxCellHeight, 50);
        
        return { 
            cellWidth: cellSize, 
            cellHeight: cellSize,
            gridWidth: cellSize * numCols,
            gridHeight: cellSize * numRows
        };
    }

    // Handle image upload and preview
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        try {
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                if (this.previewImg && this.imageName && this.imagePreview && this.uploadArea) {
                    this.previewImg.src = e.target.result;
                    this.imageName.textContent = file.name;
                    this.imagePreview.classList.remove('hidden');
                    this.uploadArea.classList.add('hidden');
                }
            };
            reader.readAsDataURL(file);

            // Upload to server
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/image/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.imageId = result.image_id;
                console.log('Image uploaded successfully:', result);
            } else {
                throw new Error('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
            this.clearImagePreview();
        }
    }

    // Clear image preview
    clearImagePreview() {
        if (this.imagePreview && this.uploadArea && this.previewImg && this.imageName) {
            this.imagePreview.classList.add('hidden');
            this.uploadArea.classList.remove('hidden');
            this.previewImg.src = '';
            this.imageName.textContent = '';
        }
        if (this.imageInput) {
            this.imageInput.value = '';
        }
        this.imageId = null;
    }

    // Enter grid editor mode
    enterGridEditor() {
        // Validate inputs
        const rows = parseInt(this.rowsInput.value);
        const cols = parseInt(this.colsInput.value);
        const width = parseFloat(this.actualWidthInput.value);
        const length = parseFloat(this.actualLengthInput.value);

        if (!rows || rows < 1 || rows > 100) {
            alert('Please enter a valid number of rows (1-100)');
            return;
        }
        if (!cols || cols < 1 || cols > 100) {
            alert('Please enter a valid number of columns (1-100)');
            return;
        }
        if (!width || width <= 0) {
            alert('Please enter a valid width');
            return;
        }
        if (!length || length <= 0) {
            alert('Please enter a valid length');
            return;
        }

        // Store configuration
        this.actualWidth = width;
        this.actualLength = length;

        // Hide setup screen and show editor
        if (this.gridSetupScreen && this.gridEditorView) {
            this.gridSetupScreen.classList.add('hidden');
            this.gridEditorView.classList.remove('hidden');
            this.isEditorMode = true;
        }

        // Initialize the grid
        this.initializeGrid(rows, cols);

        // Update grid info in header
        if (this.gridInfo) {
            this.gridInfo.innerHTML = `
                <span class="text-neon-cyan">${rows}×${cols}</span>
                <span class="text-gray-500">•</span>
                <span class="text-gray-400">${width}m × ${length}m</span>
            `;
        }

        // Set up background image if uploaded
        if (this.imageId && this.floorPlanImage) {
            this.floorPlanImage.src = `/api/image/${this.imageId}`;
            this.floorPlanImage.classList.remove('hidden');
        }
    }

    // Exit grid editor mode
    exitGridEditor() {
        // Show setup screen and hide editor
        if (this.gridSetupScreen && this.gridEditorView) {
            this.gridSetupScreen.classList.remove('hidden');
            this.gridEditorView.classList.add('hidden');
            this.isEditorMode = false;
        }

        // Clear grid data
        this.grid = [];
        if (this.gridElement) {
            this.gridElement.innerHTML = '';
        }
    }

    // Set editing mode
    setMode(mode) {
        this.mode = mode;
        
        // Update button states
        if (this.obstacleBtn && this.clearCellBtn) {
            this.obstacleBtn.classList.toggle('active', mode === 'obstacle');
            this.clearCellBtn.classList.toggle('active', mode === 'clear');
        }
    }

    // Clear all cells
    clearAllCells() {
        if (confirm('Are you sure you want to clear all obstacles?')) {
            this.grid = this.grid.map(row => row.map(() => 0));
            this.redrawGrid();
        }
    }

    // Save grid (renamed from saveToDatabase to saveGrid)
    async saveGrid() {
        try {
            const gridData = {
                rows: this.grid.length,
                columns: this.grid[0].length,
                grid: this.grid,
                actual_width: this.actualWidth,
                actual_length: this.actualLength,
                image_id: this.imageId
            };

            const response = await fetch('/api/grid/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gridData)
            });

            if (response.ok) {
                const result = await response.json();
                alert('Grid saved successfully!');
                console.log('Grid saved:', result);
            } else {
                throw new Error('Failed to save grid');
            }
        } catch (error) {
            console.error('Error saving grid:', error);
            alert('Failed to save grid. Please try again.');
        }
    }


    showGridCreationInterface() {
        // Show instructions in the grid area for creating new grids
        if (this.gridElement) {
            this.gridElement.innerHTML = `
                <div class="flex items-center justify-center h-full min-h-[500px] text-center p-8">
                    <div class="space-y-6">
                        <div class="text-8xl mb-6">🎯</div>
                        <h3 class="text-3xl font-bold text-neon-blue">Create Your Floor Plan Grid</h3>
                        <p class="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                            Configure your grid dimensions in the left panel and click <strong class="text-neon-green">"Initialize Grid"</strong> to start creating your floor plan.
                            Click on cells to toggle between walkable (cyan) and obstacle (red) areas.
                        </p>
                        <div class="bg-cyber-lighter/30 rounded-xl p-6 max-w-xl mx-auto">
                            <div class="text-base text-gray-300 space-y-4">
                                <div class="flex items-center justify-center space-x-3">
                                    <span class="text-2xl">💡</span>
                                    <span><strong>Tip:</strong> Upload a floor plan image as background reference</span>
                                </div>
                                <div class="flex items-center justify-center space-x-3">
                                    <span class="text-2xl">🎨</span>
                                    <span><strong>Usage:</strong> Click cells to create obstacles (walls, furniture)</span>
                                </div>
                                <div class="flex items-center justify-center space-x-3">
                                    <span class="text-2xl">💾</span>
                                    <span><strong>Save:</strong> Don't forget to save your grid when finished!</span>
                                </div>
                                <div class="flex items-center justify-center space-x-3">
                                    <span class="text-2xl">📊</span>
                                    <span><strong>Statistics:</strong> View real-time stats in the right panel</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }


    // Historical grid rendering removed for performance optimization
    // Focus is now on grid creation rather than loading previous grids

    // Historical grid methods removed for performance optimization

    updateGridInfo() {
        if (!this.grid || this.grid.length === 0) {
            this.showStatsPlaceholder();
            return;
        }
        
        // Update the right sidebar statistics container
        const statsContainer = document.getElementById('gridInfoContainer');
        if (!statsContainer) return;

        const rows = this.grid.length;
        const cols = this.grid[0] ? this.grid[0].length : 0;
        const obstacleCount = this.grid.flat().filter(cell => cell === 1).length;
        const totalCells = rows * cols;
        const walkableCount = totalCells - obstacleCount;
        const obstaclePercent = totalCells > 0 ? ((obstacleCount / totalCells) * 100).toFixed(1) : '0.0';

        statsContainer.innerHTML = `
            <h3 class="text-sm font-semibold text-neon-green mb-3 flex items-center">
                <i class="fas fa-chart-bar mr-2"></i>Statistics
            </h3>
            <div class="space-y-4 text-xs">
                <div class="bg-cyber-dark/50 rounded-lg p-3">
                    <div class="text-gray-400 mb-1">Grid Size</div>
                    <div class="text-neon-cyan font-semibold">${rows} × ${cols} cells</div>
                </div>
                
                <div class="bg-cyber-dark/50 rounded-lg p-3">
                    <div class="text-gray-400 mb-1">Real Dimensions</div>
                    <div class="text-neon-cyan font-semibold">${this.actualLength}m × ${this.actualWidth}m</div>
                </div>
                
                <div class="bg-cyber-dark/50 rounded-lg p-3">
                    <div class="text-gray-400 mb-1">Obstacles</div>
                    <div class="text-red-400 font-semibold">${obstacleCount} cells</div>
                    <div class="text-red-300 text-xs">${obstaclePercent}% of total</div>
                </div>
                
                <div class="bg-cyber-dark/50 rounded-lg p-3">
                    <div class="text-gray-400 mb-1">Walkable</div>
                    <div class="text-green-400 font-semibold">${walkableCount} cells</div>
                    <div class="text-green-300 text-xs">${(100 - parseFloat(obstaclePercent)).toFixed(1)}% of total</div>
                </div>
            </div>
        `;
    }

    showStatsPlaceholder() {
        const statsContainer = document.getElementById('gridInfoContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <h3 class="text-sm font-semibold text-neon-green mb-3 flex items-center">
                <i class="fas fa-chart-bar mr-2"></i>Statistics
            </h3>
            <div class="flex items-center justify-center h-40 text-center">
                <div class="text-gray-400">
                    <div class="text-4xl mb-3">📊</div>
                    <div class="text-xs">Initialize a grid to see statistics</div>
                </div>
            </div>
        `;
    }

    // addGridPlaceholder removed - now using showGridCreationInterface()

    // Historical grid methods removed for performance optimization


    redrawGrid() {
        if (!this.grid.length || !this.gridElement) return;
        
        const rows = this.grid.length;
        const cols = this.grid[0].length;
        const { cellWidth, cellHeight } = this.calculateCellDimensions(rows, cols);

        // Update existing grid cells with new dimensions
        const gridRows = this.gridElement.children;
        for (let i = 0; i < gridRows.length; i++) {
            const rowElement = gridRows[i];
            const cells = rowElement.children;
            
            for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                cell.style.width = `${cellWidth}px`;
                cell.style.height = `${cellHeight}px`;
            }
        }
    }

    showModal() {
        if (this.gridModal) {
            this.gridModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal() {
        if (this.gridModal) {
            this.gridModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Clear modal content
        if (this.modalGrid) {
            this.modalGrid.innerHTML = '';
        }
        
        if (this.modalFloorPlanImage) {
            this.modalFloorPlanImage.src = '';
        }
        
        if (this.modalTimestamp) {
            this.modalTimestamp.textContent = '';
        }
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.showLoading();

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload-image/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            this.imageId = data.image_id;

            // Display image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                // Set preview image
                if (this.previewImg) {
                    this.previewImg.src = e.target.result;
                }
                
                // Show preview container and hide upload area
                if (this.imagePreview && this.uploadArea) {
                    this.uploadArea.classList.add('hidden');
                    this.imagePreview.classList.remove('hidden');
                }
                
                // Set image name
                if (this.imageName) {
                    this.imageName.textContent = file.name;
                }
                
                // Auto-generate grid dimensions based on image
                setTimeout(() => this.generateGridFromImage(), 100);
                
                console.log('Image preview updated:', file.name);
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            this.hideLoading();
        }
    }
    
    clearImagePreview() {
        // Clear the file input
        if (this.imageInput) {
            this.imageInput.value = '';
        }
        
        // Clear preview image
        if (this.previewImg) {
            this.previewImg.src = '';
        }
        
        // Clear image name
        if (this.imageName) {
            this.imageName.textContent = '';
        }
        
        // Hide preview and show upload area
        if (this.imagePreview && this.uploadArea) {
            this.imagePreview.classList.add('hidden');
            this.uploadArea.classList.remove('hidden');
        }
        
        // Clear stored image ID
        this.imageId = null;
        
        console.log('Image preview cleared');
    }
    
    // Image-based grid generation with 1:1 pixel mapping
    generateGridFromImage() {
        if (!this.previewImg || !this.previewImg.src) {
            return null;
        }
        
        const img = new Image();
        img.onload = () => {
            const imageWidth = img.naturalWidth;
            const imageHeight = img.naturalHeight;
            
            console.log(`Original image dimensions: ${imageWidth}x${imageHeight}`);
            
            // Create grid that matches image dimensions exactly
            // Option 1: 1:1 pixel mapping (may be too large)
            // Option 2: Scaled down by factor for performance
            
            let gridCols, gridRows;
            const maxRecommendedCells = 5000; // Reasonable performance limit
            const totalPixels = imageWidth * imageHeight;
            
            if (totalPixels <= maxRecommendedCells) {
                // Use 1:1 mapping for small images
                gridCols = imageWidth;
                gridRows = imageHeight;
                console.log(`Using 1:1 pixel mapping: ${gridCols}x${gridRows}`);
            } else {
                // Scale down large images while maintaining aspect ratio
                const scaleFactor = Math.sqrt(totalPixels / maxRecommendedCells);
                gridCols = Math.round(imageWidth / scaleFactor);
                gridRows = Math.round(imageHeight / scaleFactor);
                console.log(`Scaled down by factor ${scaleFactor.toFixed(2)}: ${gridCols}x${gridRows}`);
            }
            
            // Ensure reasonable limits
            gridCols = Math.max(10, Math.min(1000, gridCols));
            gridRows = Math.max(10, Math.min(1000, gridRows));
            
            // Update input fields with calculated values
            if (this.rowsInput) this.rowsInput.value = gridRows;
            if (this.colsInput) this.colsInput.value = gridCols;
            
            // Calculate real-world dimensions based on cell size
            // Each cell represents the image area divided by grid cells
            const pixelsPerCellX = imageWidth / gridCols;
            const pixelsPerCellY = imageHeight / gridRows;
            const avgPixelsPerCell = (pixelsPerCellX + pixelsPerCellY) / 2;
            
            // Assume 1 pixel = 0.01 meters (adjustable scale)
            const pixelToMeterScale = 0.01;
            const realWidth = (gridCols * avgPixelsPerCell * pixelToMeterScale);
            const realHeight = (gridRows * avgPixelsPerCell * pixelToMeterScale);
            
            if (this.actualWidthInput) this.actualWidthInput.value = realWidth.toFixed(1);
            if (this.actualLengthInput) this.actualLengthInput.value = realHeight.toFixed(1);
            
            console.log(`Generated grid: ${gridCols}x${gridRows}, Real dimensions: ${realWidth.toFixed(1)}x${realHeight.toFixed(1)}m`);
        };
        
        img.src = this.previewImg.src;
    }

    initializeGrid(rows = null, cols = null) {
        // Use provided parameters or get from inputs
        const numRows = rows || parseInt(this.rowsInput.value);
        const numCols = cols || parseInt(this.colsInput.value);
        
        if (!numRows || !numCols || numRows < 1 || numCols < 1) {
            console.error('Invalid grid dimensions');
            return;
        }

        // Initialize grid data
        this.grid = Array(numRows).fill().map(() => Array(numCols).fill(0));

        // Calculate cell dimensions (now always square and matched to image if available)
        const { cellWidth, cellHeight, gridWidth, gridHeight, imageWidth, imageHeight } = this.calculateCellDimensions(numRows, numCols);

        // Create grid cells with optimized DOM manipulation
        this.gridElement.innerHTML = '';
        this.gridElement.classList.remove('grid-placeholder');
        
        // Set grid element to use exact image dimensions if available
        if (imageWidth && imageHeight) {
            this.gridElement.style.cssText = `
                display: grid;
                grid-template-columns: repeat(${numCols}, ${cellWidth}px);
                grid-template-rows: repeat(${numRows}, ${cellHeight}px);
                gap: 0px;
                width: ${gridWidth}px;
                height: ${gridHeight}px;
                position: relative;
                margin: 0 auto;
                overflow: visible;
            `;
        } else {
            this.gridElement.style.cssText = `
                display: grid;
                grid-template-columns: repeat(${numCols}, ${cellWidth}px);
                grid-template-rows: repeat(${numRows}, ${cellHeight}px);
                gap: 1px;
                justify-content: center;
                align-content: center;
                width: ${gridWidth}px;
                height: ${gridHeight}px;
                max-width: 100%;
                max-height: 100vh;
                overflow: auto;
                margin: 0 auto;
            `;
        }
        
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.style.cssText = `
                    width: ${cellWidth}px;
                    height: ${cellHeight}px;
                    border: 1px solid #374151;
                    background-color: rgba(31, 41, 55, 0.3);
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                
                // Add drag and click events for cell editing
                cell.addEventListener('mousedown', (e) => this.handleCellMouseDown(e, i, j, cell));
                cell.addEventListener('mouseenter', (e) => this.handleCellMouseEnter(e, i, j, cell));
                cell.addEventListener('mouseup', () => this.handleCellMouseUp());
                
                // Prevent context menu and text selection
                cell.addEventListener('contextmenu', (e) => e.preventDefault());
                cell.addEventListener('selectstart', (e) => e.preventDefault());
                
                // Visual feedback on hover
                cell.addEventListener('mouseenter', () => {
                    if (!this.isDragging) {
                        cell.style.transform = 'scale(1.05)';
                        cell.style.zIndex = '10';
                    }
                });
                cell.addEventListener('mouseleave', () => {
                    if (!this.isDragging) {
                        cell.style.transform = 'scale(1)';
                        cell.style.zIndex = '1';
                    }
                });
                
                fragment.appendChild(cell);
            }
        }
        
        this.gridElement.appendChild(fragment);
        
        // Set background image if uploaded - use original dimensions
        if (this.floorPlanImage && this.floorPlanImage.src) {
            if (imageWidth && imageHeight) {
                // Use original image size without scaling
                this.gridElement.style.backgroundImage = `url(${this.floorPlanImage.src})`;
                this.gridElement.style.backgroundSize = `${imageWidth}px ${imageHeight}px`;
                this.gridElement.style.backgroundPosition = 'top left';
                this.gridElement.style.backgroundRepeat = 'no-repeat';
                this.gridElement.style.backgroundAttachment = 'local';
                console.log(`Background image applied at original size: ${imageWidth}x${imageHeight}px`);
            } else {
                // Fallback for when no image dimensions available
                this.gridElement.style.backgroundImage = `url(${this.floorPlanImage.src})`;
                this.gridElement.style.backgroundSize = '100% 100%';
                this.gridElement.style.backgroundPosition = 'center';
                this.gridElement.style.backgroundRepeat = 'no-repeat';
                this.gridElement.style.backgroundAttachment = 'local';
                console.log('Background image applied with scaling (fallback)');
            }
        }
        
        // Store cell size for later use
        this.cellSize = Math.min(cellWidth, cellHeight);
        
        console.log(`Grid initialized: ${numRows}x${numCols}, cell size: ${this.cellSize}px`);
    }
    
    // Drag functionality for obstacle marking
    handleCellMouseDown(event, row, col, cellElement) {
        event.preventDefault();
        
        if (!this.mode || this.mode === 'view') return;
        
        this.isDragging = true;
        this.dragMode = this.mode;
        this.lastProcessedCell = `${row}-${col}`;
        
        // Apply the action to the starting cell
        this.applyCellAction(row, col, cellElement);
        
        // Add global mouse events
        document.addEventListener('mousemove', this.handleDocumentMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleDocumentMouseUp.bind(this));
        
        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
    }
    
    handleCellMouseEnter(event, row, col, cellElement) {
        if (this.isDragging && this.dragMode) {
            const currentCell = `${row}-${col}`;
            if (currentCell !== this.lastProcessedCell) {
                this.applyCellAction(row, col, cellElement);
                this.lastProcessedCell = currentCell;
            }
        }
    }
    
    handleCellMouseUp() {
        // Individual cell mouse up - drag might continue
    }
    
    handleDocumentMouseMove(event) {
        if (this.isDragging) {
            // Update cursor style during drag
            document.body.style.cursor = this.dragMode === 'obstacle' ? 'crosshair' : 'not-allowed';
        }
    }
    
    handleDocumentMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragMode = null;
            this.lastProcessedCell = null;
            
            // Restore normal cursor and text selection
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            
            // Remove global event listeners
            document.removeEventListener('mousemove', this.handleDocumentMouseMove.bind(this));
            document.removeEventListener('mouseup', this.handleDocumentMouseUp.bind(this));
            
            console.log('Drag operation completed');
        }
    }
    
    applyCellAction(row, col, cellElement) {
        if (this.dragMode === 'obstacle') {
            this.setCellAsObstacle(row, col, cellElement);
        } else if (this.dragMode === 'clear') {
            this.clearCell(row, col, cellElement);
        }
    }
    
    setCellAsObstacle(row, col, cellElement) {
        this.grid[row][col] = 1;
        cellElement.style.backgroundColor = 'rgba(220, 38, 38, 0.8)';
        cellElement.classList.add('obstacle');
    }

    handleCellClick(row, col, cellElement) {
        // This is now primarily for fallback - drag is the main interaction
        if (!this.mode || this.mode === 'view') return;
        
        this.applyCellAction(row, col, cellElement);
    }
    
    toggleObstacle(row, col, cellElement) {
        // Legacy method - now uses setCellAsObstacle for consistency
        this.grid[row][col] = this.grid[row][col] === 1 ? 0 : 1;
        
        if (this.grid[row][col] === 1) {
            this.setCellAsObstacle(row, col, cellElement);
        } else {
            this.clearCell(row, col, cellElement);
        }
    }
    
    clearCell(row, col, cellElement) {
        this.grid[row][col] = 0;
        cellElement.style.backgroundColor = 'rgba(31, 41, 55, 0.3)'; // Semi-transparent default color
        cellElement.classList.remove('obstacle');
    }
    
    updateGridInfo() {
        // Optional: Update any grid statistics or info displays
        const totalCells = this.grid.length * this.grid[0].length;
        const obstacleCells = this.grid.flat().filter(cell => cell === 1).length;
        console.log(`Grid info - Total: ${totalCells}, Obstacles: ${obstacleCells}`);
    }

    createClickRipple(event, cell) {
        // Removed ripple effect for better performance
        // Just add a quick visual feedback via class
        cell.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 100);
    }

    validateInputs(rows, cols, actualWidth, actualLength) {
        // If parameters provided, validate them
        if (arguments.length === 4) {
            return rows > 0 && cols > 0 && actualWidth > 0 && actualLength > 0;
        }
        
        // Otherwise validate input elements
        if (!this.rowsInput || !this.colsInput || !this.actualWidthInput || !this.actualLengthInput) {
            return false;
        }

        const numRows = parseInt(this.rowsInput.value);
        const numCols = parseInt(this.colsInput.value);
        const width = parseFloat(this.actualWidthInput.value);
        const length = parseFloat(this.actualLengthInput.value);

        return !isNaN(numRows) && !isNaN(numCols) && !isNaN(width) && !isNaN(length) &&
               numRows > 0 && numCols > 0 && width > 0 && length > 0;
    }

    async saveToDatabase() {
        if (!this.grid.length) {
            alert('Please initialize the grid first');
            return;
        }

        if (!this.validateInputs()) {
            alert('Please ensure all input fields are filled with valid values');
            return;
        }

        try {
            this.showLoading();

            const response = await fetch('/api/grid/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grid: this.grid,
                    rows: parseInt(this.rowsInput.value),
                    columns: parseInt(this.colsInput.value),
                    actual_width: parseFloat(this.actualWidthInput.value),
                    actual_length: parseFloat(this.actualLengthInput.value),
                    image_id: this.imageId
                }),
            });

            if (!response.ok) throw new Error('Save failed');

            const data = await response.json();
            alert('Grid saved successfully! Your floor plan has been saved to the database.');
            
            // No need to reload historical grids - focus on current grid creation

        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save grid data');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = '<div class="text-xl">Loading...</div>';
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new GridEditor();
});



