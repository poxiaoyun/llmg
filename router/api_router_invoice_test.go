package router

import (
	"testing"

	"github.com/gin-gonic/gin"
)

func hasRoute(routes gin.RoutesInfo, method string, path string) bool {
	for _, route := range routes {
		if route.Method == method && route.Path == path {
			return true
		}
	}
	return false
}

func TestAdminInvoiceRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	SetApiRouter(engine)

	routes := engine.Routes()

	if !hasRoute(routes, "GET", "/api/user/invoice/requests") {
		t.Fatalf("expected GET /api/user/invoice/requests to be registered")
	}

	if !hasRoute(routes, "PUT", "/api/user/invoice/requests/:id") {
		t.Fatalf("expected PUT /api/user/invoice/requests/:id to be registered")
	}

	if !hasRoute(routes, "POST", "/api/user/invoice/requests/:id/file") {
		t.Fatalf("expected POST /api/user/invoice/requests/:id/file to be registered")
	}

	if !hasRoute(routes, "GET", "/api/user/invoice/requests/:id/file") {
		t.Fatalf("expected GET /api/user/invoice/requests/:id/file to be registered")
	}

	if !hasRoute(routes, "GET", "/api/user/invoice/files/:id") {
		t.Fatalf("expected GET /api/user/invoice/files/:id to be registered")
	}
}