$(document).ready(function () {
  //// لما الصفحة تحمل اعملي الكود

  let map = L.map("map").setView([27.5, 30.5], 7); // القاهرة  [27.5, 30.5]      // 2- إضافة خريطة الأساس (Tile Layer)
  let osm = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "© OpenStreetMap contributors",
    }
  );
  osm.addTo(map);
  //*******************************************  //// layerControl (Tile Layer) <--/////**************************************** */
  let OpenStreetMap_Mapnik = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  //*********************************************************************************************************** */
  let drawFeature = new L.FeatureGroup(); /// عرفته في الاول عشان اعمل اي تحليلات سواء رسم يدوي او geojson
  map.addLayer(drawFeature);

  // طبقة الابراج
  let towerNet = L.geoJSON(tower, {
    onEachFeature: function (feature, layer) {
      let lon = feature.geometry.coordinates[0];
      let lat = feature.geometry.coordinates[1];

      let popupContent = `
      <div>
        <strong>📍 إحداثيات</strong><br>
        خط العرض: ${lat}<br>
        خط الطول: ${lon}
      </div>
    `;
      layer.bindPopup(popupContent);

      layer.on("click", function () {
        let bounds = L.latLngBounds([
          [lat - 0.0005, lon - 0.0005],
          [lat + 0.0005, lon + 0.0005],
        ]);
        map.fitBounds(bounds);
      });
    },
  }).addTo(map);

  //  بعدها على طول، ضيف النقط دي إلى drawFeature
  towerNet.eachLayer(function (layer) {
    drawFeature.addLayer(layer);
  });
  map.removeLayer(towerNet);

  //*********************************************************************************************************** */
  // tileLayer.wms <--///

  let wms = L.tileLayer
    .wms("http://10.100.100.106:8051/geoserver/gov/wms", {
      layers: "gov", // GeoServer ← غيّرها لاسم الطبقة الموجود في
      format: "image/png",
      transparent: true,
      attribution: "GeoServer WMS",
    })
    .addTo(map);

  let baseMaps = {
    OpenStreetMap: OpenStreetMap_Mapnik,
    osm: osm,
  };
  let overlayMaps = {
    wms: wms,
    tower: towerNet,
    //"cairo":cairoLayer,
  };
  L.control
    .layers(baseMaps, overlayMaps, {
      collapsed: true,
      position: "topright",
      zIndex: 90000000000000,
    })
    .addTo(map);

  //*********************************************************************************************************** */

  // // My  location <--///
  // let btnZoom = document.getElementById('zoomBtn');
  // let Group;

  // function getPosition(position) {
  //     let lat = position.coords.latitude; // x
  //     let long = position.coords.longitude; // Y
  //     let accuracy = position.coords.accuracy; // buffer in meters
  //     let markerLocation = L.marker([lat, long]); // mark my location
  //     let circle = L.circle([lat, long], { radius: accuracy }); //Buffer my location

  //     // console.log(lat, long, accuracy);

  //     markerLocation.bindPopup(`<h3>المساحة العسكرية</h3> <img class="w-100" src="image/المساحة.png"/>`);
  //     circle.bindPopup(`${accuracy} Meters`);

  //     // عند الضغط على الزر نضيف الـ marker والدائرة إلى الخريطة
  //     btnZoom.addEventListener('click', function () {
  //         if (Group) {
  //             map.flyTo([lat, long], 18, { duration: 1.5 });
  //         } else {
  //             // إضافة النقطة إلى الخريطة عند الضغط على الزر
  //             Group = L.featureGroup([markerLocation, circle]).addTo(map);
  //         }
  //     });
  // }
  // // استخدام watchPosition لالتقاط الموقع أولاً
  // navigator.geolocation.watchPosition(getPosition);

  //*********************************************************************************************************** */
  // leaflet routing plugin  <--///

  let points = []; // هنا هنجمع النقطتين اللي هترسميهم

  map.on("draw:created", function (kanaba) {
    let layer = kanaba.layer;
    let type = kanaba.layerType;

    if (type === "marker") {
      let latlng = layer.getLatLng();
      if (points.length < 2) {
        points.push(latlng);
      }
    }

    drawFeature.addLayer(layer); // نضيف الطبقة مهما كان نوعها (مش بس ماركر)
  });

  // لما تضغطي على زرار "أفضل مسار"
  // let bestRouting = document.getElementById("bestRouting");
  // bestRouting.addEventListener("click", function () {
  //   if (points.length < 2) {
  //     alert("من فضلك ارسم نقطتين على الخريطة الأول");
  //     return;
  //   }

  //   // نحذف أي مسار قديم قبل ما نرسم الجديد
  //   if (window.routingControl) {
  //     map.removeControl(window.routingControl);

  //   }

  //   // نرسم أفضل مسار بين النقطتين
  //   window.routingControl = L.Routing.control({
  //     waypoints: points,
  //     routeWhileDragging: true,
  //     draggableWaypoints: true,
  //   }).addTo(map);
  // });
  //*********************************************************************************************************** */
  // Map Scalebar--->
  L.control
    .scale({
      position: "bottomleft", // مكان المقياس
      imperial: true, // لا تستخدم وحدات الميل
      metric: true, // استخدم وحدات المتر والكيلومتر
      maxWidth: 200, // أقصى عرض للمقياس بالبكسل
    })
    .addTo(map);
  /////////////////////////////////////  "leaflet Darw" ///////////////////////////////////////////////////

  let controlDraw = new L.Control.Draw({
    position: "bottomleft", // المكان على الخريطة
    edit: {
      featureGroup: drawFeature,
      remove: true,
    },
  }); // لوحة التحكم
  map.addControl(controlDraw);

  map.on("draw:created", function (kanaba) {
    let layer = kanaba.layer;
    drawFeature.addLayer(layer); // نرسم النقطة عالخريطة
    //console.log(kanaba)
  });

  //** section two
  // Edite geometry*/
  map.on("draw:edited", function (Kanba) {
    let layers = Kanba.layers;
    layers.eachLayer(function (layer) {
      ///  btnSave in draw:edited
      alert("tam");
    });
  });
  //*********************************************************************************************************/
  //************************************************************************************************* */
  ///*************************************** bulding New Cairo****************   */
  let cairoLayer = L.geoJSON(cairo, {
    style: {
      color: "gold",
      weight: 1,
      fillColor: "gold",
      fillOpacity: 0.5,
    },

    onEachFeature: function (feature, layer) {
      // تفاعل مع الداتا وعرضها

      // عند الضغط على المبنى → تكبير تلقائي
      layer.on("click", function () {
        map.fitBounds(layer.getBounds(), { padding: [30, 30] });
      });

      let popupContent = `
     <div style="font-family: Arial, sans-serif; padding: 10px; min-width: 220px; color: #2c3e50; 10px; text-align: center;">
          <h4 style="margin: 0 0 10px; text-align: center; color: #2c3e50;"> بيانات المبنى</h4>
          <p style="margin: 5px 0; font-size: 16px;">
            <strong style="color: #34495e;">المحافظة:</strong> ${feature.properties.gov_name}
          </p>
          <p style="margin: 5px 0; font-size: 16px;">
            <strong style="color: #34495e;">إسم المركز:</strong> ${feature.properties.sec_name}
          </p>
          <p style="margin: 5px 0; font-size: 16px;">
            <strong style="color: #34495e;">إسم الشياحة:</strong> ${feature.properties.ssec_name}
          </p>
          <p style="margin: 5px 0; font-size: 16px;">
            <strong style="color: #34495e;">التصنيف:</strong> ${feature.properties.type}
          </p>
    </div>`;
      layer.bindPopup(popupContent);
    },
  }).addTo(map);

  ///////////////////////////** تحليل نقط الابراج علي المباني ********************/////////////////*/
  //************************************************************************************************* */

  let bufferLayerr;
  let bufferss;

  function createBuffer() {
    const radius = parseFloat(document.getElementById("radiusInputt").value); // get El Value mn El input

    if (isNaN(radius) || radius < 0.5 || radius > 2) {
      alert(" من فضلك أدخل نصف قطر بين 0.5 و 2 كم."); /// 1
      return;
    }

    // امسح البافر القديم
    if (bufferLayerr) {
      map.removeLayer(bufferLayerr); //2
    }

    if (towerNet) {
      if (map.hasLayer(towerNet)) {
        // لو الطبقة ظاهرة على الخريطة → دخلها في التحليل
        towerNet.eachLayer(function (layer) {
          if (!drawFeature.hasLayer(layer)) {
            drawFeature.addLayer(layer);
          }
        });
      } else {
        // لو الطبقة مش ظاهرة → شيلها من التحليل
        towerNet.eachLayer(function (layer) {
          if (drawFeature.hasLayer(layer)) {
            drawFeature.removeLayer(layer);
          }
        });
      }
    }

    // GeoJSON  تحويل نقاط الأبراج المرسومة إلى
    const towerPoints = drawFeature.toGeoJSON();

    if (!towerPoints.features.length) {
      alert("من فضلك أدخل برج");
      return;
    }
    // buffer حوالين كل برج
    bufferss = turf.featureCollection(
      towerPoints.features.map(
        (point) => turf.buffer(point, radius, { units: "kilometers" }) //3
      )
    );

    // عرض البافر على الخريطة
    bufferLayerr = L.geoJSON(bufferss, {
      //4
      style: {
        color: "blue",
        fillColor: "blue",
        fillOpacity: 0.1,
      },
    }).addTo(map);
  }

  //  استدعاء الفنكشن من زر التحليل
  let analyzeBtnn = document.getElementById("analyzeBtnn"); // 5
  analyzeBtnn.addEventListener("click", function () {
    createBuffer();
  });

  //**********//*/*/*/*/ */
  //** //  buffer  → نحذف  input لو المستخدم مسح القيمة من
  document
    .getElementById("radiusInputt")
    .addEventListener("input", function () {
      let value = this.value.trim();
      if (value === "" && bufferLayerr) {
        map.removeLayer(bufferLayerr);
        bufferLayerr = null;

        cairoLayer.eachLayer(function (layer) {
          layer.setStyle({
            color: "blue",
            weight: 1,
            fillColor: "blue",
            fillOpacity: 0.5,
          });
        });
      }
    });

  //************************************** Analysis Building  */******************************* */
  //***************************************** ****************************** ***************************/
  let select = document.getElementById("select");

  function checkBuildingCoverage() {
    if (!bufferss || !bufferss.features.length) {
      alert("❌ لا توجد بيانات Buffer حالياً.");
      return;
    }

    cairoLayer.eachLayer(function (layer) {
      let isCovered = false;

      try {
        const buildingGeometry = layer.feature.geometry;

        for (let i = 0; i < bufferss.features.length; i++) {
          const bufferGeometry = bufferss.features[i].geometry;

          // ✅ نستخدم contains بدل intersects
          if (turf.booleanContains(bufferGeometry, buildingGeometry)) {
            isCovered = true;
            break;
          }
        }
      } catch (e) {
        console.warn("⚠️ خطأ أثناء فحص المبنى:", e);
      }

      if (isCovered) {
        layer.setStyle({
          color: "green",
          fillColor: "green",
          fillOpacity: 0.6,
          weight: 1,
        });
      } else {
        layer.setStyle({
          color: "red",
          fillColor: "red",
          fillOpacity: 0.4,
          weight: 1,
        });
      }
    });
  }

  select.addEventListener("click", function () {
    checkBuildingCoverage();
  });

  //*****************************************suggestTower***************************************************** */
  //********************************************************************************************************** */

  // تفعيل الزر
  let suggestTower = document.getElementById("suggestTower");

  function suggestKMeansTowers(k = 4, bufferRadius = 0.5) {
    if (!bufferss || !bufferss.features.length) {
      alert("⚠️ لازم تعمل Buffer الأول.");
      return;
    }

    if (window._suggestedKmeansLayers) {
      window._suggestedKmeansLayers.forEach((layer) => map.removeLayer(layer));
    }
    window._suggestedKmeansLayers = [];

    let uncovered = [];

    cairoLayer.eachLayer((layer) => {
      let isCovered = false;
      for (let i = 0; i < bufferss.features.length; i++) {
        if (turf.booleanContains(bufferss.features[i], layer.feature)) {
          isCovered = true;
          break;
        }
      }
      if (!isCovered) {
        uncovered.push(layer.feature);
      }
    });

    if (uncovered.length === 0) {
      alert("✅ كل المباني مغطاة بالفعل.");
      return;
    }

    const centroids = turf.featureCollection(
      uncovered.map((f) => turf.centroid(f))
    );
    const areaInKm2 = turf.area(turf.bboxPolygon(turf.bbox(centroids))) / 1e6;
    const adjustedK = areaInKm2 < 1 ? 1 : k;

    const clustered = turf.clustersKmeans(centroids, {
      numberOfClusters: adjustedK,
    });

    const clusters = [
      ...new Set(clustered.features.map((f) => f.properties.cluster)),
    ];
    const suggestedBuffers = [];

    const redIcon = L.icon({
      iconUrl: "../image/tower2.png",
      iconSize: [40, 40],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    clusters.forEach((clusterId) => {
      const points = clustered.features.filter(
        (f) => f.properties.cluster === clusterId
      );
      const center = turf.centroid(turf.featureCollection(points));
      const buffer = turf.buffer(center, bufferRadius, { units: "kilometers" });
      suggestedBuffers.push(buffer);

      const leafletLatLng = [
        center.geometry.coordinates[1],
        center.geometry.coordinates[0],
      ];

      const bufferLayer = L.geoJSON(buffer, {
        style: { color: "blue", fillColor: "blue", fillOpacity: 0.1 },
      }).addTo(map);

      const marker = L.marker(leafletLatLng, { icon: redIcon })
        .bindPopup(` برج مقترح رقم (${clusterId + 1})`)
        .addTo(map);

      window._suggestedKmeansLayers.push(marker, bufferLayer);
    });

    cairoLayer.eachLayer((layer) => {
      const geom = layer.feature.geometry;
      const isInside = suggestedBuffers.some((buffer) =>
        turf.booleanIntersects(geom, buffer.geometry)
      );

      if (isInside) {
        layer.setStyle({
          color: "gold",
          fillColor: "gold",
          fillOpacity: 0.7,
          weight: 1,
        });
      }
    });

    alert(`✅ تم اقتراح ${clusters.length} برج لتغطية المناطق غير المغطاة.`);
  }

  // ✅ زر التفعيل الديناميكي
  suggestTower.addEventListener("click", function () {
    createBuffer();
    checkBuildingCoverage();

    const userRadius = parseFloat(
      document.getElementById("radiusInputt").value
    );
    if (isNaN(userRadius) || userRadius < 0.5 || userRadius > 2) {
      alert("⚠️ من فضلك أدخل نصف قطر بين 0.5 و 2 كم.");
      return;
    }

    suggestKMeansTowers(4, userRadius); // ← استخدم قيمة المستخدم
  });

  ////////////////////////////////////////selectBuilding//////////////////////////////////////////////////////////////////
  document
    .getElementById("selectBuilding")
    .addEventListener("click", function () {
      if (!window._suggestedKmeansLayers || !bufferss) {
        alert("⚠️ لا يوجد بيانات تداخل حتى الآن.");
        return;
      }

      const proposedBuffers = window._suggestedKmeansLayers
        .filter((l) => l instanceof L.GeoJSON)
        .map((l) => l.toGeoJSON().features[0]);

      let manualBuffers = bufferss.features || [];
      let blueCount = 0;

      cairoLayer.eachLayer((layer) => {
        const geom = layer.feature.geometry;

        const intersectSuggested = proposedBuffers.filter((buff) =>
          turf.booleanIntersects(buff.geometry, geom)
        ).length;

        const intersectManual = manualBuffers.some((buff) =>
          turf.booleanIntersects(buff.geometry, geom)
        );

        if (
          (intersectManual && intersectSuggested > 0) ||
          intersectSuggested >= 2
        ) {
          layer.setStyle({
            color: "blue",
            fillColor: "blue",
            fillOpacity: 0.7,
            weight: 1,
          });
          blueCount++;
        }
      });

      // تحديث فقط عدد المباني المتداخلة
      const row = document.querySelector("#blueCountRow");
      if (row) {
        row.style.display = "block";
        row.innerHTML = ` المباني المتداخلة في التغطية : <strong style="color:blue">${blueCount}</strong>`;
      }
    });

  //***////******************************** downloadData************************************************************** */ */
  document
    .getElementById("downloadData")
    .addEventListener("click", function () {
      if (!drawFeature || !bufferss || !cairoLayer) {
        alert("⚠️ تأكد من رسم الأبراج وتحليل التغطية قبل التصدير.");
        return;
      }

      const radius = parseFloat(document.getElementById("radiusInputt").value);
      const towerPoints = drawFeature.toGeoJSON().features || [];
      const manualBuffers = bufferss.features || [];

      const proposedMarkers =
        window._suggestedKmeansLayers?.filter((l) => l instanceof L.Marker) ||
        [];
      const proposedBuffers =
        window._suggestedKmeansLayers
          ?.filter((l) => l instanceof L.GeoJSON)
          .map((l) => l.toGeoJSON().features[0]) || [];

      // حساب التغطية
      let coveredManual = 0;
      let coveredSuggested = 0;
      let blueCount = 0;
      let totalBuildings = 0;

      cairoLayer.eachLayer((layer) => {
        const geom = layer.feature.geometry;
        totalBuildings++;

        let isManual = manualBuffers.some((buffer) =>
          turf.booleanContains(buffer, geom)
        );
        let suggestedCount = proposedBuffers.filter((buffer) =>
          turf.booleanIntersects(buffer.geometry, geom)
        ).length;

        if (isManual && suggestedCount > 0) {
          blueCount++;
        } else if (suggestedCount >= 2) {
          blueCount++;
        } else if (suggestedCount === 1) {
          coveredSuggested++;
        } else if (isManual) {
          coveredManual++;
        }
      });

      const uncovered =
        totalBuildings - (coveredManual + coveredSuggested + blueCount);

      // بناء صفوف البيانات
      const rows = [];

      // الأبراج المرسومة
      towerPoints.forEach((f, index) => {
        const coords = f.geometry.coordinates;
        rows.push({
          "نوع البرج": `برج مرسوم ${index + 1}`,
          "خط الطول (X)": coords[0],
          "خط العرض (Y)": coords[1],
          "نصف القطر (كم)": radius,
        });
      });

      // الأبراج المقترحة
      proposedMarkers.forEach((marker, index) => {
        const coords = marker.getLatLng();
        rows.push({
          "نوع البرج": `برج مقترح ${index + 1}`,
          x: coords.lng,
          y: coords.lat,
          "نصف القطر (كم)": radius,
        });
      });

      // صف واحد فيه الإحصائيات
      rows.push({
        "نوع البرج": " إجمالي التحليل",
        "خط الطول (X)": "",
        "خط العرض (Y)": "",
        "نصف القطر (كم)": "",
        "الأبراج المرسومة": towerPoints.length,
        "الأبراج المقترحة": proposedMarkers.length,
        "المباني المغطاة يدويًا": coveredManual,
        "المباني المغطاة من الأبراج المقترحة": coveredSuggested,
        "المباني المتداخلة": blueCount,
        "المباني غير المغطاة": uncovered,
      });

      // تصدير
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "تحليل التغطية");
      XLSX.writeFile(workbook, "تحليل_التغطية.xlsx");
    });

  ///////////////////////////////////dispalyyyy/////////////////////////////////////////////////
  document.getElementById("display").addEventListener("click", function () {
    const radius = parseFloat(document.getElementById("radiusInputt").value);
    if (isNaN(radius) || radius < 0.5 || radius > 2) {
      alert("⚠️ من فضلك أدخل نصف قطر بين 0.5 و 2 كم.");
      return;
    }

    if (!bufferss || !drawFeature) {
      alert("⚠️ من فضلك نفذ التحليل أولاً.");
      return;
    }

    const towerPoints = drawFeature.toGeoJSON();
    const bufferFeatures = bufferss.features;

    let covered = 0;
    let uncovered = 0;

    // ✅ الحساب بالدقة كما في checkBuildingCoverage (باستخدام booleanContains)
    cairoLayer.eachLayer((layer) => {
      const geom = layer.feature.geometry;
      const isCovered = bufferFeatures.some((buffer) =>
        turf.booleanContains(buffer.geometry, geom)
      );
      if (isCovered) covered++;
      else uncovered++;
    });

    const proposedCount = window._suggestedKmeansLayers
      ? window._suggestedKmeansLayers.filter((l) => l instanceof L.Marker)
          .length
      : 0;

    // ❌ حذف حساب blueBuildingsCount من هنا (خليها في زرار selectBuilding فقط)

    const content = `
    <ul style="padding-left: 20px;">
      <p> الأبراج المرسومة: <strong style="color:blue">${towerPoints.features.length}</strong></p>
      <p> الأبراج المقترحة: <strong style="color:blue">${proposedCount}</strong></p>
      <p> نصف القطر : <strong style="color:blue">${radius} كم</strong></p>
      <p> المباني المغطاة: <strong style="color:blue">${covered}</strong></p>
      <p> المباني غير المغطاة: <strong style="color:blue">${uncovered}</strong></p>
    </ul>
  `;

    document.getElementById("dataContent").innerHTML = content;
    document.getElementById("dataDisplay").style.display = "block";
    updateBuildingStats();
  });
  ////////////////////////////////////////////updateBuildingStats////////////////////////////////////////////
  function updateBuildingStats() {
    if (!cairoLayer) return;

    const radius = parseFloat(document.getElementById("radiusInputt").value);
    if (isNaN(radius) || radius < 0.5 || radius > 2) return;

    const towerPoints = drawFeature?.toGeoJSON()?.features || [];
    const manualBuffers = bufferss?.features || [];

    const proposedMarkers =
      window._suggestedKmeansLayers?.filter((l) => l instanceof L.Marker) || [];
    const proposedBuffers =
      window._suggestedKmeansLayers
        ?.filter((l) => l instanceof L.GeoJSON)
        .map((l) => l.toGeoJSON().features[0]) || [];

    let coveredManual = 0;
    let coveredSuggested = 0;
    let blueCount = 0;
    let totalBuildings = 0;

    cairoLayer.eachLayer((layer) => {
      const geom = layer.feature.geometry;
      totalBuildings++;

      let isCoveredManual = manualBuffers.some((buffer) =>
        turf.booleanIntersects(buffer.geometry, geom)
      );

      let suggestedCount = proposedBuffers.filter((buffer) =>
        turf.booleanIntersects(buffer.geometry, geom)
      ).length;

      // ✅ مبنى داخل تغطية يدوية ومقترحة
      if (isCoveredManual && suggestedCount > 0) {
        blueCount++;
      }
      // ✅ مبنى داخل أكثر من buffer مقترح
      else if (suggestedCount >= 2) {
        blueCount++;
      }
      // ✅ مبنى داخل buffer مقترح فقط
      else if (suggestedCount === 1) {
        coveredSuggested++;
      }
      // ✅ مبنى داخل buffer يدوي فقط
      else if (isCoveredManual) {
        coveredManual++;
      }
      // ✳️ الباقي هيكون غير مغطى
    });

    const totalCovered = coveredManual + coveredSuggested + blueCount;
    const uncovered = totalBuildings - totalCovered;

    const content = `
  <table style="width:100%; border-collapse: collapse; font-size: 14px; direction: rtl; text-align: center;">
    <thead>
      <tr style="background-color: #e0e0e0;">
        <th style="border: 1px solid #ccc; padding: 6px; text-align: center;">Data</th>
        <th style="border: 1px solid #ccc; padding: 6px; text-align: center;">Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">Drawn Towers</td>
        <td style="border: 1px solid #ccc; padding: 6px; color:blue; text-align: center;">${towerPoints.length}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">Suggested Towers</td>
        <td style="border: 1px solid #ccc; padding: 6px; color:blue; text-align: center;">${proposedMarkers.length}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">Radius</td>
        <td style="border: 1px solid #ccc; padding: 6px; color:blue; text-align: center;">${radius} Km</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">Manually Covered Buildings</td>
        <td style="border: 1px solid #ccc; padding: 6px; color:green; text-align: center;">${coveredManual}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">Buildings Covered by Suggested Towers</td>
        <td style="border: 1px solid #ccc; padding: 6px; color:green; text-align: center;">${coveredSuggested}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">Buildings with Overlapping Coverage</td>
        <td style="border: 1px solid #ccc; padding: 6px; color:blue; text-align: center;">${blueCount}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">Uncovered Buildings</td>
        <td style="border: 1px solid #ccc; padding: 6px; color:red; text-align: center;">${uncovered}</td>
      </tr>
    </tbody>
  </table>
`;

    document.getElementById("dataContent").innerHTML = content;
    document.getElementById("dataDisplay").style.display = "block";
  }

  ///************************************************inputSelected************************************************************** */
  let governorateLayers = {
    cairo: cairoLayer,
    // أضف باقي المحافظات هنا إن وجدت
  };
  document
    .getElementById("governorateDropdown")
    .addEventListener("change", function () {
      const selected = this.value;
      if (selected === "cairo") {
        map.flyTo([30.0444, 31.3501], 13.5, { duration: 1 });
      }
    });
  //********************card ****************************/
  document.getElementById("cardd").addEventListener("change", function () {
    let card = document.getElementById("card");
    if (this.value) {
      card.style.display = "none";
    }
  });

  $(document).ready(function () {
    $("#loading").fadeOut(3000, function () {});
  });

  window.addEventListener("resize", function () {
    map.invalidateSize(); // لازم تُستخدم علشان Leaflet يعيد رسم الخريطة

    //////////////////toggleSidebarBtn/////////////////////////
    $("#toggleSidebarBtn").on("click", function () {
      $("#sidebar").removeClass("d-none").css("dispay:flex");
    });

    // إغلاق القائمة
    $("#closeSidebarBtn").on("click", function () {
      $("#sidebar").css("hidden");
      setTimeout(function () {
        $("#sidebar").addClass("d-none");
      }); // الانتظار حتى نهاية الأنميشن
    });
  });

  ///////////////////clear analysis/////////////////////////////////////////
  document.getElementById("clear").addEventListener("click", function () {
    // 1. إزالة النقاط المرسومة يدويًا
    if (drawFeature) {
      drawFeature.clearLayers();
    }

    // 2. إزالة buffer
    if (bufferLayerr) {
      map.removeLayer(bufferLayerr);
      bufferLayerr = null;
    }

    // 3. إزالة الأبراج المقترحة (KMeans)
    if (window._suggestedKmeansLayers) {
      window._suggestedKmeansLayers.forEach((layer) => map.removeLayer(layer));
      window._suggestedKmeansLayers = [];
    }

    // 4. إعادة تلوين طبقة المباني
    cairoLayer.eachLayer(function (layer) {
      layer.setStyle({
        color: "blue",
        fillColor: "blue",
        fillOpacity: 0.5,
        weight: 1,
      });
    });

    // ✅ 5. تصفير محتوى عرض البيانات (لكن لا نخفي الـ display)
    document.getElementById("dataContent").innerHTML = `
    <ul style="padding-left: 20px;">
      <p> الأبراج المرسومة: <strong>0</strong></p>
      <p> نصف القطر : <strong>0 كم</strong></p>
      <p> المباني المغطاة: <strong>0</strong></p>
      <p> المباني غير المغطاة: <strong>0</strong></p>
      <p> الأبراج المقترحة: <strong>0</strong></p>
      <p> المباني داخل تغطية مزدوجة: <strong>0</strong></p>
    </ul>
  `;
  });

  //////////////////////////////id="closeDisplayBtn"/////////////////////////////////////////////////////////

  document
    .getElementById("closeDisplayBtn")
    .addEventListener("click", function () {
      document.getElementById("dataDisplay").style.display = "none";
    });

  ///////////endddd////////////////
});
