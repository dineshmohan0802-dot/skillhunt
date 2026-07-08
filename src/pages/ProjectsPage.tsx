import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Code2, Search, GitBranch, ExternalLink, Vote } from "lucide-react";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: activeEvent } = trpc.event.active.useQuery();
  const { data: projects, isLoading } = trpc.project.list.useQuery(
    { eventId: activeEvent?.id ?? 0 },
    { enabled: !!activeEvent },
  );
  const { data: categories } = trpc.project.categories.useQuery(
    { eventId: activeEvent?.id ?? 0 },
    { enabled: !!activeEvent },
  );
  const { data: myVote } = trpc.vote.myVote.useQuery(
    { eventId: activeEvent?.id ?? 0 },
    { enabled: isAuthenticated && !!activeEvent },
  );

  const utils = trpc.useUtils();
  const voteMutation = trpc.vote.cast.useMutation({
    onSuccess: () => {
      utils.vote.myVote.invalidate();
      utils.project.list.invalidate();
    },
  });

  const canVote = activeEvent?.status === "review_and_voting_open";

  const filteredProjects = projects?.filter((p) => {
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.abstract?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) ?? [];

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-[#0F2A4A] flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-[#0F2A4A]">Projects</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0F2A4A] mb-2">Browse Projects</h1>
          <p className="text-gray-600">
            {activeEvent ? `${activeEvent.name} — ${projects?.length ?? 0} projects submitted` : "Loading..."}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={categoryFilter === "all" ? "default" : "outline"}
              onClick={() => setCategoryFilter("all")}
            >
              All
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Project Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <Code2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-2">No projects found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const isVotedFor = myVote?.projectId === project.id;
              return (
                <Card
                  key={project.id}
                  className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md overflow-hidden"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="h-36 bg-gradient-to-br from-[#0F2A4A] to-[#22B8CF] flex items-center justify-center relative">
                    <Code2 className="w-10 h-10 text-white/30" />
                    {project.previewStatus === "live" && (
                      <Badge className="absolute top-3 right-3 bg-green-500 text-white text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">{project.category}</Badge>
                      {isVotedFor && (
                        <Badge className="bg-[#22B8CF] text-white text-xs">
                          <Vote className="w-3 h-3 mr-1" />
                          Voted
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-[#0F2A4A] mb-2 line-clamp-1 group-hover:text-[#22B8CF] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.abstract}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        {project.githubUrl && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {project.githubCommitCount ?? 0}
                          </span>
                        )}
                      </div>
                      {canVote && isAuthenticated && !isVotedFor && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#22B8CF] hover:text-[#1da8bc]"
                          onClick={(e) => {
                            e.stopPropagation();
                            voteMutation.mutate({
                              eventId: project.eventId,
                              projectId: project.id,
                            });
                          }}
                        >
                          <Vote className="w-4 h-4 mr-1" />
                          Vote
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
