const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'Mapas.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the side panel aside section
const asideStart = content.indexOf('<aside className={`mapas-side-panel');
const asideEnd = content.indexOf('</aside>', asideStart) + '</aside>'.length;

// New aside content
const newAside = `<aside className={${"`"}mapas-side-panel${"${"}isNavigating ? " mapas-side-panel--nav-hidden" : ""}${"`}"} aria-label="Panel de rutas">
                {/* ====== MODE: ROUTES ====== */}
                {panelMode === "routes" && (
                  <>
                    <div className="mapas-route-cards">
                      {routeStats.map((route) => (
                        <button
                          type="button"
                          key={route.id}
                          className={${"`"}mapas-route-card mapas-ui-card${"${"}route.id === selectedRouteId ? " mapas-route-card--active" : ""}${"`}"}
                          onClick={() => {
                            if (route.id !== selectedRouteId) {
                              setSelectedRouteId(route.id);
                              setIsRouteExpanded(true);
                              setIsNavigationOpen(false);
                              clearRouteLayer();
                            }
                          }}
                        >
                          <div>
                            <p className="mapas-route-card-title">{route.name}</p>
                            <p className="mapas-route-card-count">{route.count} sitios</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <article className="mapas-main-card mapas-ui-card">
                      <button
                        type="button"
                        className="mapas-main-card-header"
                        onClick={() => setIsRouteExpanded((v) => !v)}
                      >
                        <div>
                          <p className="mapas-main-card-title">
                            {routeStats.find((r) => r.id === selectedRouteId)?.name ?? "Ruta Patrimonial"}
                          </p>
                          <p className="mapas-main-card-count">
                            {routeStats.find((r) => r.id === selectedRouteId)?.count ?? 0} sitios
                          </p>
                        </div>
                        <span className={${"`"}mapas-chevron${"${"}isRouteExpanded ? " expanded" : ""}${"`}"}>v</span>
                      </button>

                      {isRouteExpanded && (
                        <div className="mapas-main-card-body">
                          <div className="mapas-places-list">
                            {filteredPlaces.length > 0 ? (
                              filteredPlaces.map((place) => (
                                <button
                                  type="button"
                                  key={place.id}
                                  className={${"`"}mapas-place-item${"${"}selectedPlaceId === place.id ? " active" : ""}${"`}"}
                                  onClick={() => handleSelectPlace(place)}
                                >
                                  <span className="mapas-place-dot" />
                                  <span>{place.name}</span>
                                </button>
                              ))
                            ) : (
                              <p className="mapas-empty-state">No hay lugares que coincidan con la búsqueda.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  </>
                )}

                {/* ====== MODE: PLACE ====== */}
                {panelMode === "place" && activePlace && (
                  <div className="mapas-place-card mapas-ui-card">
                    <div className="mapas-place-card__row">
                      <div 
                        className="mapas-place-card__thumb"
                        style={{
                          backgroundImage: imgErrors[activePlace.id] ? undefined : 'url("' + activePlace.image + '")',
                          backgroundSize: 'cover',
                          backgroundPosition: activePlace.imagePosition || 'center',
                        }}
                      >
                        {imgErrors[activePlace.id] && <span className="mapas-place-card__noimg">📍</span>}
                        <img src={activePlace.image} alt="" onError={() => handleImgError(activePlace.id)} style={{ width: 0, height: 0, position: 'absolute' }} />
                      </div>
                      <div className="mapas-place-card__info">
                        <span className="mapas-place-card__kicker">{activePlace.categoryLabel}</span>
                        <strong className="mapas-place-card__name">{activePlace.name}</strong>
                      </div>
                      <button type="button" className="mapas-place-card__back" onClick={goBackToRoutes} aria-label="Volver a rutas">&times;</button>
                    </div>
                    <div className="mapas-place-card__actions">
                      <button type="button" className="mapas-place-card__btn mapas-place-card__btn--details" onClick={() => { setView("expanded"); setIsPlacePopupOpen(false); }}>
                        <span>↗</span> Ver detalles
                      </button>
                      <button type="button" className="mapas-place-card__btn mapas-place-card__btn--route" onClick={handleTraceRoute}>
                        <span>🗺</span> C&oacute;mo llegar
                      </button>
                    </div>
                  </div>
                )}

                {/* ====== MODE: NAVIGATION ====== */}
                {panelMode === "navigation" && activePlace && (
                  <div className="mapas-nav-card mapas-ui-card">
                    <div className="mapas-nav-card__header">
                      <span className="mapas-nav-card__title">C&oacute;mo llegar a {activePlace.name}</span>
                      <button type="button" className="mapas-nav-card__close" onClick={goBackToRoutes} aria-label="Cerrar">&times;</button>
                    </div>
                    <div className="mapas-nav-card__body">
                      {isRouteLoading ? (
                        <div className="mapas-nav-card__loading">Calculando ruta...</div>
                      ) : (
                        <>
                          <div className="mapas-nav-card__modes">
                            {[
                              { key: "walking", label: "🚶", dur: formatDuration(routePlans["walking"]?.duration), dist: formatDistance(routePlans["walking"]?.distance) },
                              { key: "car", label: "🚗", dur: formatDuration(routePlans["car"]?.duration), dist: formatDistance(routePlans["car"]?.distance) },
                              { key: "transit", label: "🚌", dur: formatDuration(routePlans["transit"]?.duration), dist: formatDistance(routePlans["transit"]?.distance) },
                            ].map((mode) => {
                              const hasPlan = !!routePlans[mode.key];
                              const isActive = travelMode === mode.key;
                              return (
                                <button
                                  key={mode.key}
                                  type="button"
                                  className={isActive ? "mapas-nav-card__mode mapas-nav-card__mode--active" : "mapas-nav-card__mode"}
                                  onClick={() => setTravelMode(mode.key)}
                                  disabled={!hasPlan}
                                >
                                  <span className="mapas-nav-card__mode-icon">{mode.label}</span>
                                  <span className="mapas-nav-card__mode-info">
                                    <span className="mapas-nav-card__mode-dur">{mode.dur}</span>
                                    <span className="mapas-nav-card__mode-dist">{mode.dist}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {currentNavigationPlan && (
                            <button
                              type="button"
                              className={isNavigating ? "mapas-nav-card__gps mapas-nav-card__gps--active" : "mapas-nav-card__gps"}
                              onClick={() => { isNavigating ? stopRealNavigation() : startRealNavigation(); }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                              {isNavigating ? 'Detener navegación GPS' : 'Iniciar navegación GPS'}
                            </button>
                          )}

                          {currentNavigationPlan && !isRouteLoading && (
                            <div className="mapas-nav-card__summary">
                              <div className="mapas-nav-card__stat">
                                <span className="mapas-nav-card__stat-label">Distancia</span>
                                <span className="mapas-nav-card__stat-value">{formatDistance(routePlans[travelMode]?.distance)}</span>
                              </div>
                              <div className="mapas-nav-card__stat">
                                <span className="mapas-nav-card__stat-label">Duraci&oacute;n</span>
                                <span className="mapas-nav-card__stat-value">{formatDuration(routePlans[travelMode]?.duration)}</span>
                              </div>
                              <div className="mapas-nav-card__stat">
                                <span className="mapas-nav-card__stat-label">Llegada</span>
                                <span className="mapas-nav-card__stat-value">{formatEta(routePlans[travelMode]?.duration)}</span>
                              </div>
                            </div>
                          )}

                          {routeMessage && (
                            <div className={"mapas-nav-card__msg mapas-nav-card__msg--" + routeStatus}>{routeMessage}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </aside>`;

content = content.slice(0, asideStart) + newAside + content.slice(asideEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
