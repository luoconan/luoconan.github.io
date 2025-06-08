<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trip Sheet</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="updateTime">
    <button class="myButton" onclick="localStorage.setItem('pw','');location.reload()">log out</button>
    Update Time: <span id="updateTime" style="color: beige;"></span>
  </div>
  <div class="container">
    <div class="timeline-container">
      <div class="timeline-header"></div>
      <div class="drivers"></div>
    </div> 
    <div class="display-panel">
      <div class="search-wrapper">
        <h3>Filter</h3>
        <input type="text" id="searchInput" name="searchInput" placeholder="Filter the PRT Name">
      </div>
      <div class="display-content"></div>
    </div>
  </div>
  <script type="module" src="MD5.js"></script>
  <script type="module" src="TripSheetScript.js"></script>
</body>
</html>
