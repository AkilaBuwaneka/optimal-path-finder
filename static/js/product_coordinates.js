document.addEventListener("DOMContentLoaded", function () {
  const historicalGrids = document.getElementById("historicalGrids");
  const gridContainer = document.getElementById("gridContainer");
  const gridElement = document.getElementById("grid");
  const productModal = document.getElementById("productModal");
  const closeModal = document.querySelector(".close");
  const productForm = document.getElementById("productForm");

  fetch("/api/grid/")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then((grids) => {
      console.log('Loaded grids for product coordinates:', grids);
      grids.forEach((grid) => {
        const gridItem = document.createElement("div");
        gridItem.className = "historical-grid-item";
        gridItem.innerHTML = `
            <div class="text-sm font-medium">${grid.rows}×${
          grid.columns
        } Grid</div>
            <div class="text-xs text-gray-500">${new Date(
              grid.timestamp
            ).toLocaleString()}</div>
            <div class="text-xs mt-1">Dimensions: ${grid.actual_width}m × ${
          grid.actual_length
        }m</div>
          `;
        gridItem.addEventListener("click", () => displayGrid(grid));
        historicalGrids.appendChild(gridItem);
      });
    })
    .catch((error) => {
      console.error("Error fetching grids:", error);
      historicalGrids.innerHTML = `
        <div class="text-red-500 p-4">
          <div class="text-sm font-semibold mb-2">Failed to load historical grids</div>
          <div class="text-xs text-gray-400">${error.message}</div>
          <div class="text-xs text-gray-400 mt-1">Please try refreshing the page.</div>
        </div>
      `;
    });

  function displayGrid(grid) {
    gridElement.innerHTML = "";

    const gridWidth = Math.min(window.innerWidth * 0.9, 1200);
    const aspectRatio = grid.actual_length / grid.actual_width;
    const gridHeight = gridWidth * aspectRatio;

    gridContainer.style.width = `${gridWidth}px`;
    gridContainer.style.height = `${gridHeight}px`;

    const cellWidth = gridWidth / grid.columns;
    const cellHeight = gridHeight / grid.rows;
    gridElement.style.gridTemplateColumns = `repeat(${grid.columns}, ${cellWidth}px)`;
    gridElement.style.gridTemplateRows = `repeat(${grid.rows}, ${cellHeight}px)`;

    grid.grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellDiv = document.createElement("div");
        cellDiv.className = "grid-cell";
        cellDiv.style.width = `${cellWidth}px`;
        cellDiv.style.height = `${cellHeight}px`;
        cellDiv.style.backgroundColor = cell === 1 ? "black" : "white";
        cellDiv.addEventListener("click", () =>
          openProductModal(rowIndex, colIndex)
        );
        gridElement.appendChild(cellDiv);
      });
    });

    if (grid.image_id) {
      loadHistoricalImage(grid.image_id);
    } else {
      gridElement.style.backgroundImage = "";
    }
  }

  function openProductModal(x, y) {
    document.getElementById("xCoord").value = x;
    document.getElementById("yCoord").value = y;
    productModal.style.display = "flex";
  }

  closeModal.addEventListener("click", () => {
    productModal.style.display = "none";
  });

  productForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(productForm);
    const productData = Object.fromEntries(formData.entries());

    fetch("/api/save_product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    })
      .then((response) => response.json())
      .then((data) => {
        alert("Product saved successfully!");
        productModal.style.display = "none";
      })
      .catch((error) => {
        console.error("Error saving product:", error);
        alert("Failed to save product. Please try again.");
      });
  });

  async function loadHistoricalImage(imageId) {
    try {
      const response = await fetch(`/api/image/${imageId}`);
      if (!response.ok) throw new Error("Failed to fetch image");

      const data = await response.json();
      gridElement.style.backgroundImage = `url(data:image/jpeg;base64,${data.content})`;
      gridElement.style.backgroundSize = "cover"; // Ensure the image covers the entire grid area
      gridElement.style.backgroundPosition = "center";
      gridElement.style.backgroundRepeat = "no-repeat";
    } catch (error) {
      console.error("Error loading historical image:", error);
      gridElement.style.backgroundImage = "";
    }
  }
});

/* Image processing */
document
  .getElementById("uploadForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append("floorPlan", document.getElementById("floorPlan").files[0]);

    fetch("/api/upload_floor_plan/", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        fetch(`/api/process_image/${data.filename}`)
          .then((response) => response.json())
          .then((data) => displayGrid(data.grid));
      })
      .catch((error) => {
        console.error("Error uploading floor plan:", error);
        alert("Failed to upload floor plan. Please try again.");
      });
  });

function displayGrid(grid) {
  const gridElement = document.getElementById("grid1");
  gridElement.innerHTML = "";

  const gridWidth = Math.min(window.innerWidth * 0.9, 1200);
  const aspectRatio = grid.length / grid[0].length;
  const gridHeight = gridWidth * aspectRatio;

  gridElement.style.width = `${gridWidth}px`;
  gridElement.style.height = `${gridHeight}px`;
  gridElement.style.display = "grid";
  gridElement.style.gridTemplateColumns = `repeat(${grid[0].length}, 1fr)`;
  gridElement.style.gridTemplateRows = `repeat(${grid.length}, 1fr)`;

  grid.forEach((row) => {
    row.forEach((cell) => {
      const cellDiv = document.createElement("div");
      cellDiv.className = "grid-cell1";
      cellDiv.style.backgroundColor = cell === 1 ? "black" : "white";
      gridElement.appendChild(cellDiv);
    });
  });
}
