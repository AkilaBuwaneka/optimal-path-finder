"""
Enhanced pathfinding service with multiple algorithms and performance optimizations.
"""
from typing import List, Tuple, Optional, Dict, Set
import heapq
import time
from collections import defaultdict
from itertools import permutations

from app.core.models import Point
from config.logging_config import get_logger

logger = get_logger(__name__)


class PathfindingService:
    """Service for pathfinding operations with multiple algorithms."""
    
    def __init__(self):
        self.cache = {}  # Simple cache for computed paths
        self.max_cache_size = 1000
    
    def find_optimal_path(
        self, 
        grid: List[List[int]], 
        start: Point, 
        end: Point, 
        pickup_points: List[Point],
        algorithm: str = "optimal"
    ) -> Optional[List[Point]]:
        """
        Find optimal path with pickup points using specified algorithm.
        
        Args:
            grid: 2D grid where 0=free, 1=obstacle
            start: Starting point
            end: Ending point  
            pickup_points: Points to visit
            algorithm: Algorithm to use ("optimal", "fast", "balanced")
        
        Returns:
            List of points representing the path, or None if no path exists
        """
        try:
            start_time = time.time()
            
            # If no pickup points, use direct A* path
            if not pickup_points:
                path = self._a_star(grid, start, end)
                computation_time = time.time() - start_time
                logger.debug(f"Direct path computed in {computation_time:.3f}s")
                return path
            
            # Choose algorithm based on problem size and requirements
            if algorithm == "fast" or len(pickup_points) > 10:
                path = self._fast_path(grid, start, end, pickup_points)
            elif algorithm == "balanced" or len(pickup_points) > 6:
                path = self._balanced_path(grid, start, end, pickup_points)
            else:  # optimal
                path = self._optimal_path(grid, start, end, pickup_points)
            
            computation_time = time.time() - start_time
            logger.info(f"Path computed using {algorithm} algorithm in {computation_time:.3f}s")
            
            return path
            
        except Exception as e:
            logger.error(f"Pathfinding failed: {e}")
            return None
    
    def _manhattan_distance(self, p1: Point, p2: Point) -> float:
        """Calculate Manhattan distance between two points."""
        return abs(p1.x - p2.x) + abs(p1.y - p2.y)
    
    def _get_neighbors(self, point: Point, grid: List[List[int]], rows: int, cols: int) -> List[Point]:
        """Get valid neighbors for a point."""
        neighbors = []
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]  # Right, Down, Left, Up
        
        for dx, dy in directions:
            new_x, new_y = point.x + dx, point.y + dy
            if 0 <= new_x < rows and 0 <= new_y < cols and grid[new_x][new_y] == 0:
                neighbors.append(Point(x=new_x, y=new_y))
        
        return neighbors
    
    def _a_star(self, grid: List[List[int]], start: Point, end: Point) -> Optional[List[Point]]:
        """A* pathfinding algorithm."""
        # Create cache key
        cache_key = (tuple(tuple(row) for row in grid), (start.x, start.y), (end.x, end.y))
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        rows, cols = len(grid), len(grid[0])
        frontier = [(0, 0, start)]  # (priority, index, point)
        came_from = {(start.x, start.y): None}
        cost_so_far = {(start.x, start.y): 0}
        index = 0
        
        while frontier:
            _, _, current = heapq.heappop(frontier)
            current_tuple = (current.x, current.y)
            
            if current_tuple == (end.x, end.y):
                break
            
            for next_point in self._get_neighbors(current, grid, rows, cols):
                next_tuple = (next_point.x, next_point.y)
                new_cost = cost_so_far[current_tuple] + 1
                
                if next_tuple not in cost_so_far or new_cost < cost_so_far[next_tuple]:
                    cost_so_far[next_tuple] = new_cost
                    priority = new_cost + self._manhattan_distance(next_point, end)
                    index += 1
                    heapq.heappush(frontier, (priority, index, next_point))
                    came_from[next_tuple] = current_tuple
        
        # Reconstruct path
        path = []
        current_tuple = (end.x, end.y)
        
        while current_tuple in came_from:
            path.append(Point(x=current_tuple[0], y=current_tuple[1]))
            current_tuple = came_from[current_tuple]
            if current_tuple is None:
                break
        
        if path and path[-1] == start:
            result = list(reversed(path))
            # Cache result if cache isn't too large
            if len(self.cache) < self.max_cache_size:
                self.cache[cache_key] = result
            return result
        
        return None
    
    def _fast_path(self, grid: List[List[int]], start: Point, end: Point, pickup_points: List[Point]) -> Optional[List[Point]]:
        """Fast pathfinding using nearest neighbor heuristic."""
        return self._nearest_neighbor_path(grid, start, end, pickup_points)
    
    def _balanced_path(self, grid: List[List[int]], start: Point, end: Point, pickup_points: List[Point]) -> Optional[List[Point]]:
        """Balanced pathfinding using optimized distance matrix."""
        all_points = [start] + pickup_points + [end]
        distance_matrix = self._create_distance_matrix(grid, all_points)
        return self._nearest_neighbor_with_matrix(distance_matrix, start, end, pickup_points)
    
    def _optimal_path(self, grid: List[List[int]], start: Point, end: Point, pickup_points: List[Point]) -> Optional[List[Point]]:
        """Optimal pathfinding trying all permutations (for small numbers of pickup points)."""
        if len(pickup_points) > 8:  # Limit for performance
            logger.warning("Too many pickup points for optimal algorithm, falling back to balanced")
            return self._balanced_path(grid, start, end, pickup_points)
        
        best_path = None
        min_distance = float('inf')
        
        for pickup_order in permutations(pickup_points):
            current_path = []
            current_point = start
            total_distance = 0
            valid_path = True
            
            # Connect all pickup points in sequence
            for next_point in pickup_order:
                path_segment = self._a_star(grid, current_point, next_point)
                if not path_segment:
                    valid_path = False
                    break
                
                # Avoid duplicates when joining segments
                if current_path and current_path[-1] == path_segment[0]:
                    current_path.extend(path_segment[1:])
                else:
                    current_path.extend(path_segment)
                
                total_distance += len(path_segment) - 1
                current_point = next_point
            
            if not valid_path:
                continue
            
            # Connect last pickup point to end
            final_segment = self._a_star(grid, current_point, end)
            if final_segment:
                if current_path and current_path[-1] == final_segment[0]:
                    current_path.extend(final_segment[1:])
                else:
                    current_path.extend(final_segment)
                total_distance += len(final_segment) - 1
                
                if total_distance < min_distance:
                    min_distance = total_distance
                    best_path = current_path
        
        return best_path
    
    def _create_distance_matrix(self, grid: List[List[int]], points: List[Point]) -> Dict[Tuple[int, int], Dict[Tuple[int, int], List[Point]]]:
        """Precompute paths between all points."""
        paths = defaultdict(dict)
        
        for start_point in points:
            paths_from_start = self._multi_target_bfs(grid, start_point, set((p.x, p.y) for p in points if p != start_point))
            for end_tuple, path in paths_from_start.items():
                paths[(start_point.x, start_point.y)][end_tuple] = path
        
        return paths
    
    def _multi_target_bfs(self, grid: List[List[int]], start: Point, targets: Set[Tuple[int, int]]) -> Dict[Tuple[int, int], List[Point]]:
        """Modified BFS that finds paths to multiple targets efficiently."""
        rows, cols = len(grid), len(grid[0])
        queue = [(start.x, start.y)]
        visited = {(start.x, start.y): None}
        found_paths = {}
        remaining_targets = targets.copy()
        
        while queue and remaining_targets:
            current = queue.pop(0)
            
            if current in remaining_targets:
                # Reconstruct path
                path = []
                curr = current
                while curr is not None:
                    path.append(Point(x=curr[0], y=curr[1]))
                    curr = visited[curr]
                found_paths[current] = list(reversed(path))
                remaining_targets.remove(current)
            
            # Explore neighbors
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                new_x, new_y = current[0] + dx, current[1] + dy
                if (0 <= new_x < rows and 0 <= new_y < cols and
                    grid[new_x][new_y] == 0 and (new_x, new_y) not in visited):
                    visited[(new_x, new_y)] = current
                    queue.append((new_x, new_y))
        
        return found_paths
    
    def _nearest_neighbor_path(self, grid: List[List[int]], start: Point, end: Point, pickup_points: List[Point]) -> Optional[List[Point]]:
        """Simple nearest neighbor approach."""
        path = []
        current = start
        remaining = pickup_points.copy()
        
        while remaining:
            # Find nearest unvisited pickup point
            nearest = min(remaining, key=lambda p: self._manhattan_distance(current, p))
            
            # Get path to nearest point
            segment = self._a_star(grid, current, nearest)
            if not segment:
                return None
            
            # Add segment to path (avoid duplicates)
            if path and path[-1] == segment[0]:
                path.extend(segment[1:])
            else:
                path.extend(segment)
            
            current = nearest
            remaining.remove(nearest)
        
        # Add final segment to end
        final_segment = self._a_star(grid, current, end)
        if final_segment:
            if path and path[-1] == final_segment[0]:
                path.extend(final_segment[1:])
            else:
                path.extend(final_segment)
            return path
        
        return None
    
    def _nearest_neighbor_with_matrix(self, distance_matrix: Dict, start: Point, end: Point, pickup_points: List[Point]) -> Optional[List[Point]]:
        """Nearest neighbor using precomputed distance matrix."""
        current = (start.x, start.y)
        end_point = (end.x, end.y)
        unvisited = set((p.x, p.y) for p in pickup_points)
        path = []
        
        while unvisited:
            # Find nearest unvisited point
            nearest = min(unvisited, 
                         key=lambda p: len(distance_matrix[current][p]) if p in distance_matrix[current] else float('inf'))
            
            # Add path segment (avoiding duplicates)
            segment = distance_matrix[current][nearest]
            if path and path[-1] == segment[0]:
                path.extend(segment[1:])
            else:
                path.extend(segment)
            
            current = nearest
            unvisited.remove(current)
        
        # Add final segment to end
        if current in distance_matrix and end_point in distance_matrix[current]:
            final_segment = distance_matrix[current][end_point]
            if path and path[-1] == final_segment[0]:
                path.extend(final_segment[1:])
            else:
                path.extend(final_segment)
        
        return path if path else None
    
    def clear_cache(self):
        """Clear the pathfinding cache."""
        self.cache.clear()
        logger.info("Pathfinding cache cleared")