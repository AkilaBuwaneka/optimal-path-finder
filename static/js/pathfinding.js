class PathfindingUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.mode = null;
        this.start = null;
        this.end = null;
        this.pickupPoints = [];
        this.path = [];
        this.loadMaps();
        this.scaleFactor = 1;
        this.zoomLevel = 1;
        this.baseCellSize = 0;
        this.fastRenderMode = false; // Fast rendering toggle
        this.isFullscreenMode = false;
        this.minCellSize = 6;
        this.maxCellSize = 40;
        this.optimalCellSize = 20;
        // Remove fullscreenModal as we're using a different approach
    }

    initializeElements() {
        // Map selection elements
        this.mapSelectionScreen = document.getElementById('mapSelectionScreen');
        this.pathfindingView = document.getElementById('pathfindingView');
        this.mapSelect = document.getElementById('mapSelect');
        this.loadMapBtn = document.getElementById('loadMapBtn');
        this.exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
        this.mapInfo = document.getElementById('mapInfo');
        
        // Control buttons
        this.startBtn = document.getElementById('startBtn');
        this.endBtn = document.getElementById('endBtn');
        this.pickupBtn = document.getElementById('pickupBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.findPathBtn = document.getElementById('findPathBtn');
        this.detailsBtn = document.getElementById('detailsBtn');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.fastRenderBtn = document.getElementById('fastRenderBtn');
        this.fitToScreenBtn = document.getElementById('fitToScreenBtn');
        
        // Grid elements
        this.gridContainer = document.getElementById('gridContainer');
        this.gridElement = document.getElementById('grid');

        // Modal elements
        this.detailsModal = document.getElementById('detailsModal');
        this.closeDetailsBtn = document.getElementById('closeDetailsBtn');
        this.gridInfo = document.getElementById('gridInfo');
        this.coordinatesInfo = document.getElementById('coordinatesInfo');
        this.pathInfo = document.getElementById('pathInfo');

        // Add tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip hidden fixed bg-black text-white px-2 py-1 rounded text-xs z-50';
        document.body.appendChild(this.tooltip);
        
        // Check for missing critical elements
        if (!this.mapSelect) {
            console.error('Critical element missing: mapSelect');
            return;
        }
        if (!this.loadMapBtn) {
            console.error('Critical element missing: loadMapBtn');
            return;
        }
        if (!this.gridContainer) {
            console.error('Critical element missing: gridContainer');
            return;
        }
        if (!this.gridElement) {
            console.error('Critical element missing: gridElement');
            return;
        }
        
        console.log('PathfindingUI initialized successfully');
        console.log('Map selection elements:', {
            mapSelectionScreen: !!this.mapSelectionScreen,
            pathfindingView: !!this.pathfindingView,
            mapSelect: !!this.mapSelect,
            loadMapBtn: !!this.loadMapBtn,
            exitFullscreenBtn: !!this.exitFullscreenBtn
        });
    }

    showDetailsModal() {
        this.updateModalContent();
        if (this.detailsModal) {
            this.detailsModal.classList.remove('hidden');
        }
    }

    hideDetailsModal() {
        if (this.detailsModal) {
            this.detailsModal.classList.add('hidden');
        }
    }

    updateModalContent() {
        // Update grid information
        if (this.gridData && this.gridInfo) {
            this.gridInfo.innerHTML = `
                <div class="bg-cyber-lighter/30 rounded-xl border border-neon-green/30 p-4">
                    <h4 class="text-md font-semibold text-neon-green mb-3">
                        <i class="fas fa-warehouse mr-2"></i>Warehouse Information
                    </h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="text-gray-300 mb-1">Grid Size:</div>
                            <div class="text-neon-cyan">${this.gridData.rows} × ${this.gridData.columns} cells</div>
                        </div>
                        <div>
                            <div class="text-gray-300 mb-1">Real Dimensions:</div>
                            <div class="text-neon-cyan">${this.gridData.actual_length}m × ${this.gridData.actual_width}m</div>
                        </div>
                        <div>
                            <div class="text-gray-300 mb-1">Cell Size:</div>
                            <div class="text-neon-cyan">${(this.gridData.actual_length / this.gridData.rows).toFixed(2)}m × ${(this.gridData.actual_width / this.gridData.columns).toFixed(2)}m</div>
                        </div>
                        <div>
                            <div class="text-gray-300 mb-1">Total Area:</div>
                            <div class="text-neon-cyan">${(this.gridData.actual_length * this.gridData.actual_width).toFixed(2)}m²</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update coordinates information
        let coordsHtml = `
            <div class="bg-cyber-lighter/30 rounded-xl border border-neon-blue/30 p-4">
                <h4 class="text-md font-semibold text-neon-blue mb-3">
                    <i class="fas fa-map-marker-alt mr-2"></i>Coordinates Information
                </h4>
                <div class="space-y-3 text-sm">
        `;

        if (this.start) {
            const realCoords = this.gridToRealCoordinates(this.start.x, this.start.y);
            coordsHtml += `
                <div class="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg border border-blue-400/50">
                    <div class="flex items-center gap-3">
                        <div class="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded border border-neon-blue"></div>
                        <span class="text-gray-200 font-medium">Start Point</span>
                    </div>
                    <div class="text-right">
                        <div class="text-neon-cyan">Grid: (${this.start.x}, ${this.start.y})</div>
                        <div class="text-gray-400 text-xs">Real: (${realCoords.x.toFixed(2)}m, ${realCoords.y.toFixed(2)}m)</div>
                    </div>
                </div>
            `;
        }

        if (this.end) {
            const realCoords = this.gridToRealCoordinates(this.end.x, this.end.y);
            coordsHtml += `
                <div class="flex items-center justify-between p-3 bg-green-500/20 rounded-lg border border-green-400/50">
                    <div class="flex items-center gap-3">
                        <div class="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded border border-neon-green"></div>
                        <span class="text-gray-200 font-medium">End Point</span>
                    </div>
                    <div class="text-right">
                        <div class="text-neon-cyan">Grid: (${this.end.x}, ${this.end.y})</div>
                        <div class="text-gray-400 text-xs">Real: (${realCoords.x.toFixed(2)}m, ${realCoords.y.toFixed(2)}m)</div>
                    </div>
                </div>
            `;
        }

        if (this.pickupPoints.length > 0) {
            this.pickupPoints.forEach((point, index) => {
                const realCoords = this.gridToRealCoordinates(point.x, point.y);
                coordsHtml += `
                    <div class="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg border border-yellow-400/50">
                        <div class="flex items-center gap-3">
                            <div class="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded border border-yellow-400"></div>
                            <span class="text-gray-200 font-medium">Pickup Point ${index + 1}</span>
                        </div>
                        <div class="text-right">
                            <div class="text-neon-cyan">Grid: (${point.x}, ${point.y})</div>
                            <div class="text-gray-400 text-xs">Real: (${realCoords.x.toFixed(2)}m, ${realCoords.y.toFixed(2)}m)</div>
                        </div>
                    </div>
                `;
            });
        }

        if (!this.start && !this.end && this.pickupPoints.length === 0) {
            coordsHtml += `
                <div class="text-center text-gray-400 py-4">
                    <i class="fas fa-info-circle mr-2"></i>
                    No points set yet. Click the buttons above to set start, end, and pickup points.
                </div>
            `;
        }

        coordsHtml += '</div></div>';
        
        if (this.coordinatesInfo) {
            this.coordinatesInfo.innerHTML = coordsHtml;
        }

        // Update path information
        this.updatePathInfo();
    }

    updatePathInfo() {
        let pathHtml = `
            <div class="bg-cyber-lighter/30 rounded-xl border border-neon-purple/30 p-4">
                <h4 class="text-md font-semibold text-neon-purple mb-3">
                    <i class="fas fa-route mr-2"></i>Path Information
                </h4>
        `;

        if (this.path && this.path.length > 0) {
            const totalDistance = this.calculatePathDistance();
            pathHtml += `
                <div class="space-y-3 text-sm">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-gray-300 mb-1">Path Length:</div>
                            <div class="text-neon-cyan">${this.path.length} steps</div>
                        </div>
                        <div>
                            <div class="text-gray-300 mb-1">Distance:</div>
                            <div class="text-neon-cyan">${totalDistance.toFixed(2)}m</div>
                        </div>
                    </div>
                    <div class="p-3 bg-purple-500/20 rounded-lg border border-purple-400/50">
                        <div class="text-gray-200 font-medium mb-2">Optimal route calculated successfully!</div>
                        <div class="text-gray-400 text-xs">
                            The path avoids obstacles and visits all pickup points efficiently.
                        </div>
                    </div>
                </div>
            `;
        } else {
            pathHtml += `
                <div class="text-center text-gray-400 py-4">
                    <i class="fas fa-info-circle mr-2"></i>
                    No path calculated yet. Set start and end points, then click "Find Path".
                </div>
            `;
        }

        pathHtml += '</div>';
        
        if (this.pathInfo) {
            this.pathInfo.innerHTML = pathHtml;
        }
    }

    calculatePathDistance() {
        if (!this.path || this.path.length === 0 || !this.gridData) return 0;
        
        const cellWidth = this.gridData.actual_width / this.gridData.columns;
        const cellHeight = this.gridData.actual_length / this.gridData.rows;
        
        let distance = 0;
        for (let i = 1; i < this.path.length; i++) {
            const prev = this.path[i - 1];
            const curr = this.path[i];
            const dx = Math.abs(curr.x - prev.x) * cellWidth;
            const dy = Math.abs(curr.y - prev.y) * cellHeight;
            distance += Math.sqrt(dx * dx + dy * dy);
        }
        
        return distance;
    }

    bindEvents() {
        // Map selection events
        if (this.mapSelect) {
            this.mapSelect.addEventListener('change', () => this.handleMapSelection());
        }
        if (this.loadMapBtn) {
            this.loadMapBtn.addEventListener('click', () => this.enterPathfindingView());
        }
        if (this.exitFullscreenBtn) {
            this.exitFullscreenBtn.addEventListener('click', () => this.exitPathfindingView());
        }
        
        // Control button events
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.setMode('start'));
        }
        if (this.endBtn) {
            this.endBtn.addEventListener('click', () => this.setMode('end'));
        }
        if (this.pickupBtn) {
            this.pickupBtn.addEventListener('click', () => this.setMode('pickup'));
        }
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearPoints());
        }
        if (this.findPathBtn) {
            this.findPathBtn.addEventListener('click', () => this.findPath());
        }
        if (this.detailsBtn) {
            this.detailsBtn.addEventListener('click', () => this.showDetailsModal());
        }
        if (this.closeDetailsBtn) {
            this.closeDetailsBtn.addEventListener('click', () => this.hideDetailsModal());
        }
        if (this.zoomInBtn) {
            this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        if (this.zoomOutBtn) {
            this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        if (this.fastRenderBtn) {
            this.fastRenderBtn.addEventListener('click', () => this.toggleFastRender());
        }
        if (this.fitToScreenBtn) {
            this.fitToScreenBtn.addEventListener('click', () => this.fitToScreen());
        }
        
        // Close modal when clicking outside
        if (this.detailsModal) {
            this.detailsModal.addEventListener('click', (e) => {
                if (e.target === this.detailsModal) {
                    this.hideDetailsModal();
                }
            });
        }
        
        // Add resize handler for responsive grid - debounced
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (this.currentGridData) {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.renderGrid(this.currentGridData), 50);
            }
        });
        
        // Escape key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.pathfindingView && !this.pathfindingView.classList.contains('hidden')) {
                this.exitPathfindingView();
            }
        });
    }

    // Handle map selection change
    handleMapSelection() {
        const selectedValue = this.mapSelect.value;
        if (this.loadMapBtn) {
            this.loadMapBtn.disabled = !selectedValue;
            
            if (selectedValue) {
                this.loadMapBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                this.loadMapBtn.classList.add('hover:scale-105');
            } else {
                this.loadMapBtn.classList.add('opacity-50', 'cursor-not-allowed');
                this.loadMapBtn.classList.remove('hover:scale-105');
            }
        }
    }

    // Enter fullscreen pathfinding view
    async enterPathfindingView() {
        const gridId = this.mapSelect.value;
        if (!gridId) return;

        try {
            // Hide map selection screen
            if (this.mapSelectionScreen) {
                this.mapSelectionScreen.classList.add('hidden');
            }
            
            // Show pathfinding view
            if (this.pathfindingView) {
                this.pathfindingView.classList.remove('hidden');
                this.isFullscreenMode = true;
            }
            
            // Load the selected map
            await this.loadSelectedMap();
            
            // Update map info in header
            if (this.gridData && this.mapInfo) {
                this.mapInfo.innerHTML = `
                    <span class="text-neon-cyan">${this.gridData.rows}×${this.gridData.columns}</span>
                    <span class="text-gray-500">•</span>
                    <span class="text-gray-400">${this.gridData.actual_length}m × ${this.gridData.actual_width}m</span>
                `;
            }
            
        } catch (error) {
            console.error('Error entering pathfinding view:', error);
            this.exitPathfindingView();
        }
    }

    // Exit fullscreen pathfinding view
    exitPathfindingView() {
        // Show map selection screen
        if (this.mapSelectionScreen) {
            this.mapSelectionScreen.classList.remove('hidden');
        }
        
        // Hide pathfinding view
        if (this.pathfindingView) {
            this.pathfindingView.classList.add('hidden');
            this.isFullscreenMode = false;
        }
        
        // Clear any modals
        this.hideDetailsModal();
        
        // Reset map selection if needed
        if (this.mapSelect) {
            this.mapSelect.value = '';
            this.handleMapSelection();
        }
        
        // Clear grid
        if (this.gridElement) {
            this.gridElement.innerHTML = '';
        }
        this.gridData = null;
        this.currentGridData = null;
    }

    // Legacy function - replaced by calculateOptimalDisplaySettings
    calculateScale(gridData) {
        console.warn('calculateScale is deprecated, using new responsive system');
        return this.calculateOptimalDisplaySettings(gridData).cellSize;
    }

    async loadMaps() {
        try {
            console.log('Loading maps from API...');
            const response = await fetch('/api/grid/');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const grids = await response.json();
            console.log('Loaded grids:', grids);

            this.mapSelect.innerHTML = '<option value="">Select a map...</option>';
            grids.forEach(grid => {
                const option = document.createElement('option');
                option.value = grid.id;
                option.textContent = `${grid.rows}x${grid.columns} Grid (${new Date(grid.timestamp).toLocaleDateString()})`;
                this.mapSelect.appendChild(option);
            });
            
            console.log(`Successfully loaded ${grids.length} maps`);
        } catch (error) {
            console.error('Error loading maps:', error);
            // Show error message in the map select
            this.mapSelect.innerHTML = '<option value="">Error loading maps</option>';
        }
    }

    // Removed old updatePathInfo function - now handled by modal

    gridToRealCoordinates(gridX, gridY) {
        const cellWidth = this.gridData.actual_width / this.gridData.columns;
        const cellHeight = this.gridData.actual_length / this.gridData.rows;
        return {
            x: gridY * cellWidth,  // Convert column to x coordinate
            y: gridX * cellHeight  // Convert row to y coordinate
        };
    }

    showTooltip(e, text) {
        this.tooltip.textContent = text;
        this.tooltip.style.left = `${e.pageX + 10}px`;
        this.tooltip.style.top = `${e.pageY + 10}px`;
        this.tooltip.classList.remove('hidden');
    }

    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }

    async loadSelectedMap() {
        const gridId = this.mapSelect.value;
        if (!gridId) {
            if (this.gridElement) {
                this.gridElement.innerHTML = '';
            }
            return;
        }

        if (!this.gridContainer || !this.gridElement) {
            console.error('Grid container or grid element not found');
            return;
        }

        try {
            console.log(`Loading selected map with ID: ${gridId}`);
            // Show enhanced loading indicator
            this.gridContainer.classList.add('grid-loading');
            this.gridElement.innerHTML = `
                <div class="flex items-center justify-center h-64 text-neon-cyan">
                    <div class="text-center">
                        <div class="relative mb-4">
                            <div class="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <div class="absolute inset-0 w-16 h-16 border-4 border-neon-blue border-b-transparent rounded-full animate-spin mx-auto" style="animation-direction: reverse; animation-duration: 0.8s;"></div>
                        </div>
                        <div class="text-lg font-semibold">Loading Warehouse Layout</div>
                        <div class="text-sm text-gray-400 mt-1">Processing grid data...</div>
                    </div>
                </div>
            `;

            const response = await fetch(`/api/grid/${gridId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const gridData = await response.json();
            console.log('Loaded grid data:', gridData);

            this.createGrid(gridData);
            this.gridContainer.classList.remove('grid-loading');
        } catch (error) {
            console.error('Error loading map:', error);
            this.gridContainer.classList.remove('grid-loading');
            this.gridElement.innerHTML = `
                <div class="flex items-center justify-center h-64 text-red-400">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <div>Error loading warehouse layout</div>
                        <div class="text-sm text-gray-400 mt-1">${error.message}</div>
                    </div>
                </div>
            `;
        }
    }

    createGrid(gridData) {
        this.currentGridData = gridData; // Store for resize handling
        // Clear points when loading new map
        this.start = null;
        this.end = null;
        this.pickupPoints = [];
        this.path = [];
        this.renderGrid(gridData);
    }

    renderGrid(gridData) {
        if (!this.gridElement || !this.gridContainer) {
            console.error('Grid elements not found - cannot render grid');
            return;
        }
        
        this.gridElement.innerHTML = '';
        this.gridData = gridData;

        // Calculate optimal display settings
        const displaySettings = this.calculateOptimalDisplaySettings(gridData);
        
        console.log(`Grid: ${gridData.rows}x${gridData.columns}, Cell size: ${displaySettings.cellSize}px, Mode: ${displaySettings.displayMode}`);
        
        // Check if we should suggest fullscreen mode for better visibility
        if (displaySettings.shouldSuggestFullscreen && !this.isFullscreenMode) {
            this.showFullscreenSuggestion();
        }

        // Apply display settings
        this.applyGridLayout(gridData, displaySettings);

        // Create cells with optimized DOM manipulation
        this.createGridCells(gridData, displaySettings);

        // Handle background image
        if (gridData.image_id) {
            this.setupBackgroundImage(gridData.image_id);
        }

        // Add grid size indicator
        this.addGridSizeIndicator(gridData, displaySettings);

        // Restore points and update modal
        if (this.gridElement.children.length > 0) {
            this.restorePoints();
        }
        if (this.detailsModal && !this.detailsModal.classList.contains('hidden')) {
            this.updateModalContent();
        }
    }

    calculateOptimalDisplaySettings(gridData) {
        const container = this.gridContainer;
        if (!container) {
            console.error('Grid container not found');
            return {
                cellSize: 20,
                displayMode: 'balanced',
                aspectBehavior: 'balanced'
            };
        }
        
        const containerRect = container.getBoundingClientRect();
        
        // Account for padding and borders
        const availableWidth = containerRect.width - (this.isFullscreenMode ? 80 : 40);
        const availableHeight = containerRect.height - (this.isFullscreenMode ? 80 : 40);
        
        // Calculate potential cell sizes
        const maxCellSizeByWidth = Math.floor(availableWidth / gridData.columns);
        const maxCellSizeByHeight = Math.floor(availableHeight / gridData.rows);
        
        // Use the smaller of the two to maintain square cells
        let baseCellSize = Math.min(maxCellSizeByWidth, maxCellSizeByHeight);
        
        // Apply zoom factor
        let cellSize = Math.floor(baseCellSize * this.zoomLevel);
        
        // Determine display mode and constraints
        let displayMode = 'normal';
        let shouldSuggestFullscreen = false;
        
        if (this.isFullscreenMode) {
            // In fullscreen, allow larger range
            cellSize = Math.max(this.minCellSize, Math.min(cellSize, this.maxCellSize * 2));
            displayMode = 'fullscreen';
        } else {
            // Check if grid would be too small for comfortable viewing
            if (baseCellSize < this.minCellSize * 2 || (gridData.rows > 50 || gridData.columns > 50)) {
                shouldSuggestFullscreen = true;
            }
            
            // Constrain cell size for normal view
            cellSize = Math.max(this.minCellSize, Math.min(cellSize, this.maxCellSize));
        }
        
        // Determine aspect ratio behavior
        const aspectRatio = gridData.columns / gridData.rows;
        let aspectBehavior = 'balanced';
        
        if (aspectRatio > 1.5) {
            aspectBehavior = 'wide';
        } else if (aspectRatio < 0.67) {
            aspectBehavior = 'tall';
        }
        
        // Store base cell size for zoom calculations
        this.baseCellSize = baseCellSize;
        
        return {
            cellSize: cellSize,
            baseCellSize: baseCellSize,
            displayMode: displayMode,
            aspectBehavior: aspectBehavior,
            shouldSuggestFullscreen: shouldSuggestFullscreen,
            totalWidth: cellSize * gridData.columns,
            totalHeight: cellSize * gridData.rows,
            availableWidth: availableWidth,
            availableHeight: availableHeight
        };
    }

    applyGridLayout(gridData, settings) {
        const container = this.gridContainer;
        if (!container) {
            console.error('Grid container not found');
            return;
        }
        
        // Set container styles based on aspect behavior
        if (settings.aspectBehavior === 'wide') {
            container.style.overflowX = 'auto';
            container.style.overflowY = 'hidden';
        } else if (settings.aspectBehavior === 'tall') {
            container.style.overflowX = 'hidden';
            container.style.overflowY = 'auto';
        } else {
            container.style.overflow = 'auto';
        }

        // Configure grid layout
        this.gridElement.style.cssText = '';
        this.gridElement.style.display = 'grid';
        this.gridElement.style.gridTemplateColumns = `repeat(${gridData.columns}, ${settings.cellSize}px)`;
        this.gridElement.style.gridTemplateRows = `repeat(${gridData.rows}, ${settings.cellSize}px)`;
        this.gridElement.style.gap = '1px';
        this.gridElement.style.justifyContent = 'center';
        this.gridElement.style.alignContent = 'center';
        this.gridElement.style.width = 'max-content';
        this.gridElement.style.height = 'max-content';
        
        // Center the grid if it's smaller than the container
        if (settings.totalWidth < settings.availableWidth && settings.totalHeight < settings.availableHeight) {
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
        } else {
            container.style.display = 'block';
        }
    }

    createGridCells(gridData, settings) {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < gridData.rows; i++) {
            for (let j = 0; j < gridData.columns; j++) {
                const cell = document.createElement('div');
                const isObstacle = gridData.grid[i][j] === 1;
                
                cell.className = isObstacle ? 'grid-cell obstacle' : 'grid-cell walkable';
                cell.setAttribute('data-row', i);
                cell.setAttribute('data-col', j);
                
                // Set square dimensions
                cell.style.cssText = `
                    width: ${settings.cellSize}px;
                    height: ${settings.cellSize}px;
                    min-width: ${settings.cellSize}px;
                    min-height: ${settings.cellSize}px;
                    box-sizing: border-box;
                `;

                // Add interaction events
                const realCoords = this.gridToRealCoordinates(i, j);
                const tooltipText = `Grid(${i}, ${j}) | Real(${realCoords.x.toFixed(2)}m, ${realCoords.y.toFixed(2)}m) | Size: ${settings.cellSize}px`;

                cell.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltipText));
                cell.addEventListener('mouseleave', () => this.hideTooltip());
                cell.addEventListener('click', () => this.handleCellClick(i, j, cell));
                
                fragment.appendChild(cell);
            }
        }
        
        this.gridElement.appendChild(fragment);
    }

    setupBackgroundImage(imageId) {
        const container = this.gridContainer;
        if (!container) {
            console.error('Grid container not found');
            return;
        }
        
        container.style.backgroundImage = `url(/api/image/${imageId})`;
        container.style.backgroundSize = 'contain';
        container.style.backgroundRepeat = 'no-repeat';
        container.style.backgroundPosition = 'center';
    }

    restorePoints() {
        // Restore start point
        if (this.start) {
            this.getCellAt(this.start.x, this.start.y).classList.add('start-point');
        }

        // Restore end point
        if (this.end) {
            this.getCellAt(this.end.x, this.end.y).classList.add('end-point');
        }

        // Restore pickup points
        this.pickupPoints.forEach(point => {
            this.getCellAt(point.x, point.y).classList.add('pickup-point');
        });

        // Restore path
        this.path.forEach(point => {
            // Skip if it's a special point
            if (
                (this.start && point.x === this.start.x && point.y === this.start.y) ||
                (this.end && point.x === this.end.x && point.y === this.end.y) ||
                this.pickupPoints.some(p => p.x === point.x && p.y === point.y)
            ) {
                return;
            }
            this.getCellAt(point.x, point.y).classList.add('path-cell');
        });
    }

    setMode(mode) {
        this.mode = mode;

        // Remove highlights from all buttons
        [this.startBtn, this.endBtn, this.pickupBtn].forEach(btn => {
            btn.classList.remove('ring-2', 'ring-offset-2');
        });

        // Highlight the active button
        switch (mode) {
            case 'start':
                this.startBtn.classList.add('ring-2', 'ring-offset-2');
                break;
            case 'end':
                this.endBtn.classList.add('ring-2', 'ring-offset-2');
                break;
            case 'pickup':
                this.pickupBtn.classList.add('ring-2', 'ring-offset-2');
                break;
        }
    }

    handleCellClick(row, col, cell) {
        if (!this.mode || this.gridData.grid[row][col] === 1) return;

        const point = { x: row, y: col };

        switch (this.mode) {
            case 'start':
                // Clear previous start point
                if (this.start) {
                    const prevCell = this.getCellAt(this.start.x, this.start.y);
                    prevCell.classList.remove('start-point');
                }
                this.start = point;
                cell.classList.add('start-point');
                break;

            case 'end':
                // Clear previous end point
                if (this.end) {
                    const prevCell = this.getCellAt(this.end.x, this.end.y);
                    prevCell.classList.remove('end-point');
                }
                this.end = point;
                cell.classList.add('end-point');
                break;

            case 'pickup':
                const existingIndex = this.pickupPoints.findIndex(p => p.x === row && p.y === col);
                if (existingIndex === -1) {
                    this.pickupPoints.push(point);
                    cell.classList.add('pickup-point');
                } else {
                    this.pickupPoints.splice(existingIndex, 1);
                    cell.classList.remove('pickup-point');
                }
                break;
        }

        this.clearPath();
        // Update modal if it's open
        if (!this.detailsModal.classList.contains('hidden')) {
            this.updateModalContent();
        }
    }

    getCellAt(row, col) {
        return this.gridElement.children[row * this.gridData.columns + col];
    }

    clearPoints() {
        // Clear start point
        if (this.start) {
            this.getCellAt(this.start.x, this.start.y).classList.remove('start-point');
        }

        // Clear end point
        if (this.end) {
            this.getCellAt(this.end.x, this.end.y).classList.remove('end-point');
        }

        // Clear pickup points
        this.pickupPoints.forEach(point => {
            this.getCellAt(point.x, point.y).classList.remove('pickup-point');
        });

        // Clear path
        this.clearPath();

        // Reset all points
        this.start = null;
        this.end = null;
        this.pickupPoints = [];
        this.path = [];

        // Reset mode
        this.setMode(null);
    }

    clearPath() {
        this.path.forEach(point => {
            const cell = this.getCellAt(point.x, point.y);
            cell.classList.remove('path-cell');
        });
        this.path = [];
    }

    async findPath() {
        if (!this.start || !this.end) {
            alert('Please set both start and end points');
            return;
        }

        try {
            const response = await fetch('/api/pathfinding/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grid_id: this.mapSelect.value,
                    start: this.start,
                    end: this.end,
                    pickup_points: this.pickupPoints
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to find path');
            }

            const data = await response.json();
            this.displayPath(data.path);
        } catch (error) {
            console.error('Error finding path:', error);
            alert(error.message || 'Failed to find path');
        }
    }

    displayPath(path) {
        this.clearPath();
        this.path = path;

        // Animate path drawing step by step
        const pathCells = path.filter(point => {
            return !(
                (this.start && point.x === this.start.x && point.y === this.start.y) ||
                (this.end && point.x === this.end.x && point.y === this.end.y) ||
                this.pickupPoints.some(p => p.x === point.x && p.y === point.y)
            );
        });

        // Choose rendering mode based on user preference
        if (this.fastRenderMode) {
            // Instant rendering - no animation
            pathCells.forEach(point => {
                const cell = this.getCellAt(point.x, point.y);
                if (cell) {
                    cell.classList.add('path-cell');
                }
            });
            
            // Update modal immediately
            if (!this.detailsModal.classList.contains('hidden')) {
                this.updateModalContent();
            }
        } else {
            // Animated rendering - fast but smooth
            const animatePathCells = (cells, batchSize = 25) => {
                let currentBatch = 0;
                const totalBatches = Math.ceil(cells.length / batchSize);
                
                const processBatch = () => {
                    const start = currentBatch * batchSize;
                    const end = Math.min(start + batchSize, cells.length);
                    
                    for (let i = start; i < end; i++) {
                        const point = cells[i];
                        const cell = this.getCellAt(point.x, point.y);
                        if (cell) {
                            cell.classList.add('path-cell');
                        }
                    }
                    
                    currentBatch++;
                    if (currentBatch < totalBatches) {
                        // Use requestAnimationFrame for smooth animation
                        requestAnimationFrame(processBatch);
                    } else {
                        // Update modal after path is drawn
                        if (!this.detailsModal.classList.contains('hidden')) {
                            this.updateModalContent();
                        }
                    }
                };
                
                processBatch();
            };
            
            animatePathCells(pathCells);
        }
    }

    createRippleEffect(cell) {
        // Simplified ripple effect - removed for performance
        return;
    }

    zoomIn() {
        const maxZoom = this.isFullscreenMode ? 5 : 3;
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, maxZoom);
        if (this.currentGridData) {
            this.renderGrid(this.currentGridData);
        }
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.2);
        if (this.currentGridData) {
            this.renderGrid(this.currentGridData);
        }
    }

    toggleFastRender() {
        this.fastRenderMode = !this.fastRenderMode;
        
        // Update button appearance
        if (this.fastRenderMode) {
            this.fastRenderBtn.classList.add('cyber-btn-active');
            this.fastRenderBtn.title = 'Fast Rendering: ON - Click to enable animations';
        } else {
            this.fastRenderBtn.classList.remove('cyber-btn-active');
            this.fastRenderBtn.title = 'Fast Rendering: OFF - Click for instant path display';
        }
    }

    showFullscreenSuggestion() {
        // Only show once per session for the same grid
        if (this.hasShownFullscreenSuggestion) return;
        this.hasShownFullscreenSuggestion = true;
        
        // Create a subtle notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-neon-blue/90 text-white px-4 py-2 rounded-lg shadow-lg z-40 animate-pulse';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="icon-zoom-in"></span>
                <span>Large grid detected. Try fullscreen for better viewing!</span>
                <button class="ml-2 text-xs underline hover:no-underline" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    fitToScreen() {
        this.zoomLevel = 1;
        if (this.currentGridData) {
            this.renderGrid(this.currentGridData);
        }
    }

    addGridSizeIndicator(gridData, displaySettings) {
        const container = this.gridContainer;
        if (!container) {
            console.error('Grid container not found');
            return;
        }
        
        // Remove existing indicator
        const existingIndicator = container.querySelector('.grid-size-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'grid-size-indicator';
        indicator.innerHTML = `
            <div class="text-xs">
                <div>${gridData.rows} × ${gridData.columns} grid</div>
                <div>Cell: ${displaySettings.cellSize}px</div>
                <div>Mode: ${displaySettings.displayMode}</div>
                ${displaySettings.aspectBehavior !== 'balanced' ? `<div>Layout: ${displaySettings.aspectBehavior}</div>` : ''}
            </div>
        `;
        
        container.appendChild(indicator);
    }
}

// Initialize the UI when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingUI();
});