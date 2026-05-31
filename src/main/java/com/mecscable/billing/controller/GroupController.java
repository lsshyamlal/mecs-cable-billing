package com.mecscable.billing.controller;

import com.mecscable.billing.dto.request.CreateGroupRequest;
import com.mecscable.billing.dto.response.GroupResponse;
import com.mecscable.billing.security.UserPrincipal;
import com.mecscable.billing.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getAllGroups(
            @RequestParam(required = false) Long companyId) {
        if (companyId != null) {
            return ResponseEntity.ok(groupService.getGroupsByCompany(companyId));
        }
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroup(id));
    }

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(@Valid @RequestBody CreateGroupRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.createGroup(request, principal.getUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupResponse> updateGroup(@PathVariable Long id,
                                                     @Valid @RequestBody CreateGroupRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(groupService.updateGroup(id, request, principal.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        groupService.deleteGroup(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
