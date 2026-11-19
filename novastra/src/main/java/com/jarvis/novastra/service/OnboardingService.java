package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.Skill;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.entity.UserSkillGap;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.SkillRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OnboardingService {

    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final SkillRepository skillRepository;
    private final UserSkillGapRepository userSkillGapRepository;

    public OnboardingService(
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository,
            SkillRepository skillRepository,
            UserSkillGapRepository userSkillGapRepository) {
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.skillRepository = skillRepository;
        this.userSkillGapRepository = userSkillGapRepository;
    }

    public Map<String, Object> getOptions() {
        List<CareerRole> roles = careerRoleRepository.findAll();
        List<Skill> skills = skillRepository.findAll();
        return Map.of("roles", roles, "skills", skills);
    }

    @Transactional
    public Map<String, Object> saveOnboarding(
            String userId, String roleId, Integer dailyTimeLimit, Integer experienceLevel, List<String> skillIds) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        if (roleId == null || roleId.isBlank()) {
            throw new IllegalArgumentException("Career role wajib dipilih.");
        }
        if (dailyTimeLimit == null || dailyTimeLimit <= 0) {
            throw new IllegalArgumentException("Daily time limit wajib dipilih (> 0 menit).");
        }

        String uid = userId.trim();
        String rid = roleId.trim();

        User user = userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User tidak ditemukan."));
        CareerRole role = careerRoleRepository.findById(rid)
                .orElseThrow(() -> new IllegalArgumentException("Career role tidak valid."));

        user.setRoleId(role.getRoleId());
        user.setDailyTimeLimit(dailyTimeLimit);
        if (experienceLevel != null && experienceLevel >= 0) {
            user.setExperienceLevel(experienceLevel);
        }
        User savedUser = userRepository.save(user);

        // Flush delete before reinserting to avoid PK conflict on (user_id, skill_id)
        userSkillGapRepository.deleteByUserId(uid);
        userSkillGapRepository.flush();

        Set<String> validSkillIds = new LinkedHashSet<>();
        if (skillIds != null) {
            for (String rawId : skillIds) {
                if (rawId != null && !rawId.isBlank()) {
                    validSkillIds.add(rawId.trim());
                }
            }
        }

        List<String> savedSkillIds = new ArrayList<>();
        if (!validSkillIds.isEmpty()) {
            Map<String, Skill> existingSkills = skillRepository.findAllById(validSkillIds).stream()
                    .collect(java.util.stream.Collectors.toMap(Skill::getSkillId, s -> s));
            List<UserSkillGap> gaps = new ArrayList<>();
            for (String sid : validSkillIds) {
                if (!existingSkills.containsKey(sid)) {
                    throw new IllegalArgumentException("Skill tidak valid: " + sid);
                }
                UserSkillGap gap = new UserSkillGap();
                gap.setUserId(uid);
                gap.setSkillId(sid);
                gap.setCurrentLevel(BigDecimal.ZERO);
                gap.setIsPriority(true);
                gaps.add(gap);
                savedSkillIds.add(sid);
            }
            userSkillGapRepository.saveAll(gaps);
        }

        return Map.of(
                "message", "Onboarding berhasil disimpan.",
                "isOnboarded", savedUser.isOnboarded(),
                "roleName", role.getRoleName(),
                "user", savedUser,
                "skillIds", savedSkillIds);
    }
}
