package service

import (
	"testing"

	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/stretchr/testify/require"
)

func TestGetUserUsableGroupsTieredAccess(t *testing.T) {
	originalGroupRatio := ratio_setting.GroupRatio2JSONString()
	originalUserUsableGroups := setting.UserUsableGroups2JSONString()
	originalAutoGroups := setting.AutoGroups2JsonString()

	t.Cleanup(func() {
		require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(originalGroupRatio))
		require.NoError(t, setting.UpdateUserUsableGroupsByJSONString(originalUserUsableGroups))
		require.NoError(t, setting.UpdateAutoGroupsByJsonString(originalAutoGroups))
	})

	require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(`{"default":1,"vip":1,"svip":1,"tenant_a":1}`))
	require.NoError(t, setting.UpdateUserUsableGroupsByJSONString(`{"default":"Default","vip":"VIP","svip":"SVIP","tenant_a":"Tenant A"}`))
	require.NoError(t, setting.UpdateAutoGroupsByJsonString(`["default"]`))

	require.Equal(t, map[string]string{
		"default": "Default",
	}, GetUserUsableGroups("default"))

	require.Equal(t, map[string]string{
		"default": "Default",
		"vip":     "VIP",
	}, GetUserUsableGroups("vip"))

	require.Equal(t, map[string]string{
		"default":  "Default",
		"vip":      "VIP",
		"svip":     "SVIP",
		"tenant_a": "Tenant A",
	}, GetUserUsableGroups("svip"))
}

func TestGetUserAutoGroupAppendsTieredGroups(t *testing.T) {
	originalGroupRatio := ratio_setting.GroupRatio2JSONString()
	originalUserUsableGroups := setting.UserUsableGroups2JSONString()
	originalAutoGroups := setting.AutoGroups2JsonString()

	t.Cleanup(func() {
		require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(originalGroupRatio))
		require.NoError(t, setting.UpdateUserUsableGroupsByJSONString(originalUserUsableGroups))
		require.NoError(t, setting.UpdateAutoGroupsByJsonString(originalAutoGroups))
	})

	require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(`{"default":1,"vip":1,"svip":1,"tenant_a":1}`))
	require.NoError(t, setting.UpdateUserUsableGroupsByJSONString(`{"default":"Default","vip":"VIP","svip":"SVIP","tenant_a":"Tenant A"}`))
	require.NoError(t, setting.UpdateAutoGroupsByJsonString(`["default"]`))

	require.Equal(t, []string{"default"}, GetUserAutoGroup("default"))
	require.Equal(t, []string{"default", "vip"}, GetUserAutoGroup("vip"))
	require.ElementsMatch(t, []string{"default", "vip", "svip", "tenant_a"}, GetUserAutoGroup("svip"))
	require.Equal(t, "default", GetUserAutoGroup("svip")[0])
}
