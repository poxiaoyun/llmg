package service

import (
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

func GetUserUsableGroups(userGroup string) map[string]string {
	userGroup = strings.TrimSpace(userGroup)
	groupsCopy := buildTieredUserUsableGroups(userGroup)
	if userGroup != "" && len(groupsCopy) > 0 {
		specialSettings, b := ratio_setting.GetGroupRatioSetting().GroupSpecialUsableGroup.Get(userGroup)
		if b {
			// 处理特殊可用分组
			for specialGroup, desc := range specialSettings {
				if strings.HasPrefix(specialGroup, "-:") {
					// 移除分组
					groupToRemove := strings.TrimPrefix(specialGroup, "-:")
					delete(groupsCopy, groupToRemove)
				} else if strings.HasPrefix(specialGroup, "+:") {
					// 添加分组
					groupToAdd := strings.TrimPrefix(specialGroup, "+:")
					groupsCopy[groupToAdd] = desc
				} else {
					// 直接添加分组
					groupsCopy[specialGroup] = desc
				}
			}
		}
		// 如果userGroup不在可用分组中，返回可用分组 + userGroup
		if _, ok := groupsCopy[userGroup]; !ok {
			groupsCopy[userGroup] = "用户分组"
		}
	}
	return groupsCopy
}

func buildTieredUserUsableGroups(userGroup string) map[string]string {
	groups := make(map[string]string)
	addGroup := func(group string) {
		group = strings.TrimSpace(group)
		if group == "" {
			return
		}
		groups[group] = setting.GetUsableGroupDescription(group)
	}

	switch userGroup {
	case "", "default":
		addGroup("default")
	case "vip":
		addGroup("default")
		addGroup("vip")
	case "svip":
		ratioGroups := ratio_setting.GetGroupRatioCopy()
		if len(ratioGroups) == 0 {
			addGroup("default")
			addGroup("vip")
			addGroup("svip")
			break
		}
		for group := range ratioGroups {
			addGroup(group)
		}
	default:
		groupsCopy := setting.GetUserUsableGroupsCopy()
		for group, desc := range groupsCopy {
			groups[group] = desc
		}
		addGroup(userGroup)
	}

	return groups
}

func GroupInUserUsableGroups(userGroup, groupName string) bool {
	_, ok := GetUserUsableGroups(userGroup)[groupName]
	return ok
}

// GetUserAutoGroup 根据用户分组获取自动分组设置
func GetUserAutoGroup(userGroup string) []string {
	groups := GetUserUsableGroups(userGroup)
	autoGroups := make([]string, 0)
	seen := make(map[string]bool)
	for _, group := range setting.GetAutoGroups() {
		if _, ok := groups[group]; ok {
			autoGroups = append(autoGroups, group)
			seen[group] = true
		}
	}
	remainingGroups := make([]string, 0, len(groups))
	for group := range groups {
		if !seen[group] {
			remainingGroups = append(remainingGroups, group)
		}
	}
	sort.Strings(remainingGroups)
	autoGroups = append(autoGroups, remainingGroups...)
	return autoGroups
}

// GetUserGroupRatio 获取用户使用某个分组的倍率
// userGroup 用户分组
// group 需要获取倍率的分组
func GetUserGroupRatio(userGroup, group string) float64 {
	ratio, ok := ratio_setting.GetGroupGroupRatio(userGroup, group)
	if ok {
		return ratio
	}
	return ratio_setting.GetGroupRatio(group)
}
